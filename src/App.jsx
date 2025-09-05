

import { useState, useEffect } from 'react';
import './App.css';

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const AQICN_TOKEN = import.meta.env.VITE_AQICN_TOKEN;
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';




function App() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [aqi, setAqi] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch weather by city name
  const fetchWeather = async (e) => {
    e.preventDefault();
    if (!city) return;
    await getWeatherByCity(city);
  };

  // Helper: fetch weather by city
  const getWeatherByCity = async (cityName) => {
    setLoading(true);
    setError('');
    setWeather(null);
    setAqi(null);
    try {
      const res = await fetch(`${BASE_URL}?q=${cityName}&appid=${API_KEY}&units=metric`);
      const data = await res.json();
      if (data.cod !== 200) {
        setError(data.message);
      } else {
        setWeather(data);
        // Fetch AQI for city coordinates
        getAqi(data.coord.lat, data.coord.lon);
      }
    } catch (err) {
      setError('Failed to fetch weather.');
    }
    setLoading(false);
  };

  // Helper: fetch weather by coordinates
  const getWeatherByCoords = async (lat, lon) => {
    setLoading(true);
    setError('');
    setWeather(null);
    setAqi(null);
    try {
      const res = await fetch(`${BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
      const data = await res.json();
      if (data.cod !== 200) {
        setError(data.message);
      } else {
        setWeather(data);
        setCity(data.name);
        // Fetch AQI for coordinates
        getAqi(lat, lon);
      }
    } catch (err) {
      setError('Failed to fetch weather.');
    }
    setLoading(false);
  };

  // Fetch AQI from AQICN
  const getAqi = async (lat, lon) => {
    try {
      const res = await fetch(`https://api.waqi.info/feed/geo:${lat};${lon}/?token=${AQICN_TOKEN}`);
      const data = await res.json();
      if (data.status === 'ok') {
        setAqi(data.data);
      } else {
        setAqi(null);
      }
    } catch {
      setAqi(null);
    }
  };

  // On mount, get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          getWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          // If denied, fallback to default city (e.g., London)
          getWeatherByCity('London');
        }
      );
    } else {
      getWeatherByCity('London');
    }
  }, []);

  return (
    <div className="weather-app">
      <h1>Weather App</h1>
      <form onSubmit={fetchWeather} className="search-form">
        <input
          type="text"
          placeholder="Enter city name"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="search-btn">Search</button>
      </form>
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      {weather && (
        <div className="weather-card">
          <div className="weather-info-row">
            <div className="weather-info-block">
              <h2>{weather.name}, {weather.sys.country}</h2>
              <div className="weather-main">
                <img src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`} alt={weather.weather[0].description} />
                <div>
                  <p className="temp">{Math.round(weather.main.temp)}°C</p>
                  <p>{weather.weather[0].main}</p>
                </div>
              </div>
              <div className="weather-details">
                <p>Humidity: {weather.main.humidity}%</p>
                <p>Wind: {Math.round(weather.wind.speed)} m/s</p>
              </div>
            </div>
            {aqi && (
              <div className="aqi-details">
                <h3>Air Quality Index</h3>
                <p>AQI: {aqi.aqi}</p>
                <p>PM2.5: {aqi.iaqi.pm25 ? aqi.iaqi.pm25.v : 'N/A'} μg/m³</p>
                <p>PM10: {aqi.iaqi.pm10 ? aqi.iaqi.pm10.v : 'N/A'} μg/m³</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
