import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSelector, useDispatch } from 'react-redux';
import emptyHeart from '../assets/images/emptyHeart.png';
import location from '../assets/images/location.gif';
import animHeart from '../assets/images/animHeart.gif';
import { animationToStatus } from '../animationToStatus';
import ApiRequests from '../api/apiRequests';
import { db } from '../firebase';
import firebase from 'firebase';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function CurrentWeather() {
    const [liked, setliked] = useState(false);
    const dispatch = useDispatch()
    const cityName = useSelector((state) => state.city.city);
    const currentWeatherC = useSelector((state) => state.city.current_Weather_Metric);
    const currentWeatherF = useSelector((state) => state.city.current_Weather_Imperial);
    const tempStatus = useSelector((state) => state.city.weatherStatus);
    const locationKey = useSelector((state) => state.city.locationKey);
    const convertUnit = useSelector((state) => state.setting.unit);
    const [allFavorites, setallFavorites,] = useState([]);
    const [id, setId] = useState('');

    useEffect(() => {
        getCurrentWeatherFromApi()
        checkIfOnFavorites()
    }, [cityName]);

    useEffect(() => {
        db.collection('favorites')
            .orderBy('timestamp', 'desc')
            .onSnapshot((snapshot) =>
                setallFavorites(
                    snapshot.docs.map((doc) => ({
                        id: doc.id,
                        data: doc.data(),
                    })
                    )))
        dispatch({ type: 'FETCH_ALL_FAVORITES', payload: allFavorites });
    }, [])

    const checkIfOnFavorites = () => {
        allFavorites.map(({ data, id }) => {
            if (data.city === cityName) {
                setliked(true);
                setId(id);
            }
        })
    }

    const notify = () => toast("Something went wrong with fetching current weather");

    const getCurrentWeatherFromApi = async () => {
        try {
            let res = await ApiRequests.getCurrentWeather(locationKey);
            dispatch({
                type: 'GET_CURRENT_WEATHER',
                payload: {
                    tempC: res[0].Temperature.Metric.Value,
                    tempF: res[0].Temperature.Imperial.Value,
                    weatherStatus: res[0].WeatherText
                }
            })
        } catch (error) {
            notify()
        }
    }

    const addORRemoveToFavorites = () => {
        if (!liked) {
            setliked(!liked)
            db.collection('favorites').add({
                city: cityName,
                tempStatus: tempStatus,
                currentWeatherC: currentWeatherC,
                currentWeatherF: currentWeatherF,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            });

            const newFavorite = {
                cityName: cityName,
                currentWeatherC: currentWeatherC,
                currentWeatherF: currentWeatherF,
                tempStatus: tempStatus,
            }
            dispatch({ type: 'ADD_TO_FAVORITES', payload: newFavorite })
        } else {
            setliked(!liked)
            db.collection("favorites").doc(id).delete().then(() => {
            }).catch((error) => {
                console.error("Error removing document: ", error);
            });
        }
    }

    const getUserLocationFromApi = async (lat, long) => {
        try {
            let res = await ApiRequests.getUserLocation(lat, long);
            let placeName = res.LocalizedName;
            let key = res.Key
            dispatch({ type: "UPDATE_CITY", payload: { city: placeName, key: key } })
        } catch (error) {
            notify()
        }
    }

    const getUserLocation = () => {
        navigator.geolocation.getCurrentPosition((pos) => {
            let lat = pos.coords.latitude;
            let long = pos.coords.longitude;
            dispatch({ type: 'GET_USER_LOCATION', payload: { lat, long } })
            getUserLocationFromApi(lat, long)
        })
    }

    return (
        <>
            <H2>Current Weather</H2>
            <Div>
                <SectionL>
                    <Img src={animationToStatus(tempStatus)} alt="animation" />
                    <Content>
                        {cityName.toUpperCase()} <br />
                        {convertUnit ? currentWeatherF : currentWeatherC} {''}
                        {convertUnit ? '°F' : 'C°'} <br />
                        {tempStatus}
                    </Content>
                </SectionL>
                <LocationImg
                    src={location}
                    onClick={() => getUserLocation()}
                    alt="location"
                />
                <HeartImg
                    src={!liked ? emptyHeart : animHeart}
                    onClick={() => addORRemoveToFavorites()}
                    alt="emptyHeart"
                />
            </Div>
            <ToastContainer />
        </>
    )
}

const Div = styled.div`
display: flex;
flex-direction: row;
justify-content:space-between;
align-items: center;
padding-left: 3%;
padding-right: 3%;
border: 1px solid lightgray;
border-radius:20px;
width:100%;
text-align:center;
`
const SectionL = styled.div`
display: flex;

align-items: center;
`
const Img = styled.img`
width:20%;
margin-right: 3%;
`
const HeartImg = styled.img`
width:6%;
:hover{
    cursor:pointer;
}
@media(max-width: 600px) {
    width:20%;
}
`

const Content = styled.div`
display: flex;
flex-direction:column;
`
const H2 = styled.h2`
@media (max-width: 600px) {
    font-size: 20px;
  }

@media(max-width: 400px) {
    font-size: 15px;
}
@media(max-width: 300px) {
    font-size: 10px;
}
`
const P = styled.p`
font-size:20px;
`
const LocationImg = styled.img`
width:10%;
margin-bottom: 2.5%;
:hover{
    cursor:pointer;
}
@media(max-width: 600px) {
    width:30%;
}
`
