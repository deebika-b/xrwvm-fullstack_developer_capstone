import requests
import os
from dotenv import load_dotenv

load_dotenv()

# Try local backend first, if that fails, use the remote one


def get_backend_url():
    local_url = "http://localhost:3030"
    remote_url = os.getenv('backend_url', 'http://localhost:3030')

    try:
        response = requests.get(f"{local_url}/fetchDealers", timeout=2)
        if response.status_code == 200:
            print(f"Successfully connected to local backend at {local_url}")
            return local_url
    except Exception as e:
        print(f"Failed to connect to local backend: {str(e)}")

    print(f"Using remote backend at {remote_url}")
    return remote_url


backend_url = get_backend_url()
sentiment_analyzer_url = os.getenv(
    'sentiment_analyzer_url',
    default="http://localhost:5050/")

# def get_request(endpoint, **kwargs):


def get_request(endpoint, **kwargs):
    params = ""
    if kwargs:
        for key, value in kwargs.items():
            params = params + key + "=" + value + "&"

    request_url = backend_url+endpoint

    print("GET from {} ".format(request_url))
    try:
        # Call get method of requests library with URL and parameters
        response = requests.get(request_url)
        return response.json()
    except requests.RequestException as e:
        # If any network error occurs
        print(f"Network exception occurred: {str(e)}")
        return None
    except ValueError as e:
        # If JSON parsing error occurs
        print(f"JSON parsing error: {str(e)}")
        return None


def analyze_review_sentiments(text):
    request_url = sentiment_analyzer_url + "analyze/" + text
    try:
        # Call get method of requests library with URL and parameters
        response = requests.get(request_url)
        return response.json()
    except Exception as err:
        print(f"Unexpected {err=}, {type(err)=}")
        print("Network exception occurred")


def post_review(data_dict):
    request_url = backend_url + "/insert_review"
    try:
        response = requests.post(request_url, json=data_dict)
        print(response.json())
        return response.json()
    except Exception as e:
        print(f"Network exception occurred: {str(e)}")
