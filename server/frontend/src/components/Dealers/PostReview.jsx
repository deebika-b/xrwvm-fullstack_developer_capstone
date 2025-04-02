import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import "./Dealers.css";
import "../assets/style.css";
import Header from '../Header/Header';


const PostReview = () => {
  const [dealer, setDealer] = useState({});
  const [review, setReview] = useState("");
  const [model, setModel] = useState();
  const [year, setYear] = useState("");
  const [date, setDate] = useState("");
  const [carmodels, setCarmodels] = useState([]);

  let curr_url = window.location.href;
  let root_url = curr_url.substring(0,curr_url.indexOf("postreview"));
  let params = useParams();
  let id =params.id;
  let dealer_url = root_url+`djangoapp/dealer/${id}`;
  let review_url = root_url+`djangoapp/add_review`;
  let carmodels_url = root_url+`djangoapp/get_cars`;

  const postreview = async ()=>{
    let name = sessionStorage.getItem("firstname")+" "+sessionStorage.getItem("lastname");
    //If the first and second name are stores as null, use the username
    if(name.includes("null")) {
      name = sessionStorage.getItem("username");
    }
    if(!model || review === "" || date === "" || year === "" || model === "") {
      alert("All details are mandatory")
      return;
    }

    let model_split = model.split(" ");
    let make_chosen = model_split[0];
    let model_chosen = model_split[1];

    let jsoninput = JSON.stringify({
      "name": name,
      "dealership": id,
      "review": review,
      "purchase": true,
      "purchase_date": date,
      "car_make": make_chosen,
      "car_model": model_chosen,
      "car_year": year,
    });

    console.log(jsoninput);
    const res = await fetch(review_url, {
      method: "POST",
      headers: {
          "Content-Type": "application/json",
      },
      body: jsoninput,
  });

  const json = await res.json();
  if (json.status === 200) {
      window.location.href = window.location.origin+"/dealer/"+id;
  }

  }
  const get_dealer = async ()=>{
    try {
      const res = await fetch(dealer_url, {
        method: "GET"
      });
      const retobj = await res.json();
      
      if(retobj.status === 200) {
        // Check if dealer is an array or object and handle accordingly
        if (Array.isArray(retobj.dealer)) {
          let dealerobjs = Array.from(retobj.dealer)
          if(dealerobjs.length > 0) {
            console.log('Dealer found:', dealerobjs[0]);
            setDealer(dealerobjs[0]);
          }
        } else if (typeof retobj.dealer === 'object') {
          // If it's a single object, use it directly
          console.log('Dealer found (object):', retobj.dealer);
          setDealer(retobj.dealer);
        } else {
          console.error('Unexpected dealer data format:', retobj.dealer);
        }
      }
    } catch (error) {
      console.error('Error fetching dealer:', error);
    }
  }

  const get_cars = async ()=>{
    const res = await fetch(carmodels_url, {
      method: "GET"
    });
    const retobj = await res.json();
    
    let carmodelsarr = Array.from(retobj.CarModels)
    setCarmodels(carmodelsarr)
  }
  useEffect(() => {
    get_dealer();
    get_cars();
  },[]);


  return (
    <div style={{margin: 0, padding: 0}}>
      <Header/>
      <div style={{margin:"3%", padding: "20px", backgroundColor: "#f8f9fa", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)"}}>
        <h1 style={{color:"#2c3e50", marginBottom: "20px"}}>{dealer.full_name ? `Review for ${dealer.full_name}` : 'Loading dealer information...'}</h1>
        
        <div style={{marginBottom: "20px"}}>
          <label htmlFor="review" style={{display: "block", marginBottom: "8px", fontWeight: "bold"}}>Your Review:</label>
          <textarea 
            id='review' 
            placeholder="Write your review here..."
            style={{width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ddd"}}
            rows='7' 
            onChange={(e) => setReview(e.target.value)}
          ></textarea>
        </div>
        
        <div className='input_field' style={{marginBottom: "15px"}}>
          <label style={{display: "block", marginBottom: "8px", fontWeight: "bold"}}>Purchase Date:</label>
          <input 
            type="date" 
            onChange={(e) => setDate(e.target.value)}
            style={{padding: "8px", borderRadius: "4px", border: "1px solid #ddd", width: "100%"}}
          />
        </div>
        
        <div className='input_field' style={{marginBottom: "15px"}}>
          <label style={{display: "block", marginBottom: "8px", fontWeight: "bold"}}>Car Make & Model:</label>
          <select 
            name="cars" 
            id="cars" 
            onChange={(e) => setModel(e.target.value)}
            style={{padding: "8px", borderRadius: "4px", border: "1px solid #ddd", width: "100%"}}
          >
            <option value="" selected disabled hidden>Choose Car Make and Model</option>
            {carmodels.map((carmodel, index) => (
              <option key={index} value={carmodel.CarMake+" "+carmodel.CarModel}>{carmodel.CarMake} {carmodel.CarModel}</option>
            ))}
          </select>        
        </div>

        <div className='input_field' style={{marginBottom: "20px"}}>
          <label style={{display: "block", marginBottom: "8px", fontWeight: "bold"}}>Car Year:</label>
          <input 
            type="number" 
            placeholder="Enter year (2015-2023)"
            onChange={(e) => setYear(e.target.value)} 
            max={2023} 
            min={2015}
            style={{padding: "8px", borderRadius: "4px", border: "1px solid #ddd", width: "100%"}}
          />
        </div>

        <div style={{textAlign: "center", marginTop: "20px"}}>
          <button 
            onClick={postreview}
            style={{
              backgroundColor: "#3498db", 
              color: "white", 
              padding: "10px 20px", 
              border: "none", 
              borderRadius: "4px", 
              fontSize: "16px",
              cursor: "pointer",
              transition: "background-color 0.3s"
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = "#2980b9"}
            onMouseOut={(e) => e.target.style.backgroundColor = "#3498db"}
          >
            Submit Review
          </button>
        </div>
    </div>
    </div>
  )
}
export default PostReview
