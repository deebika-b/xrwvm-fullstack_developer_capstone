from django.http import JsonResponse
from django.contrib.auth import login, authenticate, logout
import logging
import json
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import CarMake, CarModel
from .populate import initiate
from .restapis import get_request, analyze_review_sentiments, post_review

# Get an instance of a logger
logger = logging.getLogger(__name__)

# Create your views here.


# Create a `login_request` view to handle sign in request
@csrf_exempt
def login_user(request):
    # Get username and password from request.POST dictionary
    data = json.loads(request.body)
    username = data['userName']
    password = data['password']
    # Try to check if provide credential can be authenticated
    user = authenticate(username=username, password=password)
    data = {"userName": username}
    if user is not None:
        # If user is valid, call login method to login current user
        login(request, user)
        data = {"userName": username, "status": "Authenticated"}
    return JsonResponse(data)


# Create a `logout_request` view to handle sign out request
def logout_request(request):
    # Log out the user
    logout(request)
    # Return a success response
    return JsonResponse({"success": True})

# Create a `registration` view to handle sign up request
# @csrf_exempt
# def registration(request):
# ...


@require_http_methods(["GET"])
def get_cars(request):
    count = CarMake.objects.filter().count()
    print(count)
    if count == 0:
        initiate()
    car_models = CarModel.objects.select_related('car_make')
    cars = []
    for car_model in car_models:
        cars.append({
            "CarModel": car_model.name,
            "CarMake": car_model.car_make.name
        })
    return JsonResponse({"CarModels": cars})


# Update the `get_dealerships` render list of dealerships
# all by default, particular state if state is passed
def get_dealerships(_, state="All"):
    # Build the endpoint based on state parameter
    # Build endpoint based on state
    if state == "All":
        endpoint = "/fetchDealers"
    else:
        endpoint = "/fetchDealers/" + state

    # Get dealerships data
    dealerships = get_request(endpoint)
    if dealerships is None:
        return JsonResponse({
            "status": 500,
            "error": "Failed to fetch dealers"
        })
    return JsonResponse({
        "status": 200,
        "dealers": dealerships
    })


def get_dealer_details(_, dealer_id):
    # Return bad request if dealer_id is not provided
    if not dealer_id:
        return JsonResponse({"status": 400, "message": "Bad Request"})

    # Try to get dealer details
    try:
        # First try the direct endpoint
        endpoint = "/fetchDealer/" + str(dealer_id)
        dealership = get_request(endpoint)

        # If we got a valid response without errors, return it
        # Check if we got a valid dealership response
        valid_response = (dealership and isinstance(dealership, dict)
                          and 'error' not in dealership)
        if valid_response:
            return JsonResponse({
                "status": 200,
                "dealer": dealership
            })

        # If direct endpoint failed, try finding dealer in all dealers
        return find_dealer_in_all_dealers(dealer_id)
    except Exception as e:
        # Log the error and return a fallback response
        # Log error and create fallback response
        # Log error details
        err_msg = f"Error fetching dealer details: {str(e)}"
        logger.error(err_msg)
        # Create fallback response
        return create_fallback_dealer_response(
            dealer_id, 500, "Error fetching dealer")


def find_dealer_in_all_dealers(dealer_id):
    """Find a dealer by ID in the complete list of dealers"""
    try:
        # Get all dealers
        all_dealers_endpoint = "/fetchDealers"
        all_dealers_response = get_request(all_dealers_endpoint)

        # Find matching dealer if possible
        if all_dealers_response and 'dealers' in all_dealers_response:
            dealer_id_int = int(dealer_id)  # Convert to integer for comparison
            for dealer in all_dealers_response['dealers']:
                if dealer.get('id') == dealer_id_int:
                    return JsonResponse({
                        "status": 200,
                        "dealer": dealer
                    })
    except Exception as fetch_all_error:
        # Log error with shorter variable
        err = str(fetch_all_error)
        logger.error(f"Error fetching all dealers: {err}")

    # If we couldn't find the dealer, return a fallback
    return create_fallback_dealer_response(
        dealer_id, 404, "Dealer not found")


def create_fallback_dealer_response(dealer_id, status_code, message):
    """Helper function to create a fallback dealer response"""
    return JsonResponse({
        "status": status_code,
        "dealer": {
            "message": message,
            "id": dealer_id,
            "full_name": f"Dealer #{dealer_id}",
            "city": "",
            "address": ""
        }
    })


def get_dealer_reviews(_, dealer_id):
    # Return bad request if dealer_id is not provided
    if not dealer_id:
        return JsonResponse({"status": 400, "message": "Bad Request"})

    # Fetch reviews for the dealer
    endpoint = "/fetchReviews/dealer/" + str(dealer_id)
    reviews = get_request(endpoint)
    # Handle empty reviews case
    if reviews is None:
        reviews = []
    # Process reviews if they exist
    elif isinstance(reviews, list) and reviews:
        process_review_sentiments(reviews)

    return JsonResponse({
        "status": 200,
        "reviews": reviews
    })


def process_review_sentiments(reviews):
    """Process sentiment analysis for a list of reviews"""
    for review_detail in reviews:
        try:
            # Analyze sentiment
            response = analyze_review_sentiments(review_detail['review'])

            # Set sentiment based on analysis results
            if response and 'sentiment' in response:
                review_detail['sentiment'] = response['sentiment']
            else:
                review_detail['sentiment'] = 'neutral'
        except Exception as e:
            print(f"Error analyzing sentiment: {str(e)}")
            review_detail['sentiment'] = 'neutral'


def add_review(request):
    if not request.user.is_anonymous:
        data = json.loads(request.body)
        try:
            post_review(data)
            return JsonResponse({
                "status": 200
            })
        except Exception:
            return JsonResponse({
                "status": 401,
                "message": "Error in posting review"
            })
    else:
        return JsonResponse({
            "status": 403,
            "message": "Unauthorized"
        })
