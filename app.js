const btn = document.getElementById("searchBtn");
const cityInput = document.getElementById("cityInput");

let debounceTimer;

cityInput.addEventListener("input", ()=>{
    const city = cityInput.value.trim();

    if ( city.length<2){
        showError("Please enter at least 2 characters");
        clearTimeout(debounceTimer);
        return;
    }
    showError("")

    clearTimeout(debounceTimer);
    debounceTimer=setTimeout(()=>{
        fetchWeather(city);
    },500);
});

async function fetchWeather(city) {
    try {
        showError("");
        toggleSkeleton(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const geoRes = await fetch(
`https://geocoding-api.open-meteo.com/v1/search?name=${city}`,
{ signal: controller.signal }
);

clearTimeout(timeoutId);
if (!geoRes.ok) {
    throw new Error("Geocoding HTTP error: " + geoRes.status);
}

const geoData = await geoRes.json();

if (!geoData.results || geoData.results.length === 0) {
    showError("City not found");
    toggleSkeleton(false);
    return;
}

const { latitude, longitude, name, timezone } = geoData.results[0];

const controller2 = new AbortController();
const timeoutId2 = setTimeout(() => controller2.abort(), 10000);

const weatherRes = await fetch(
`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relativehumidity_2m,windspeed_10m&daily=temperature_2m_max,temperature_2m_min,weathercode`,
{ signal: controller2.signal}
);

clearTimeout(timeoutId2);

if (!weatherRes.ok) {
    throw new Error("Weather HTTP error: " + weatherRes.status);
}

const weatherData = await weatherRes.json();

displayWeather(name, weatherData);
getLocalTime(timezone);

}catch (err) {
    if (err.name === "AbortError") {
        showError("Request timeout (10s)");
    } else {
        showError(err.message);
    }
    toggleSkeleton(false);
}
}
function displayWeather(city, data) {
    toggleSkeleton(false);
    document.getElementById("cityName").textContent =city;
    document.getElementById("temp").textContent =
        data.current_weather.temperature + "°C";

    document.getElementById("desc").textContent =
        weatherCodeMap[data.current_weather.weathercode]?.text || "Unknown";

    document.getElementById("humidity").textContent =
    "Humidity data available";
    document.getElementById("wind").textContent =
        data.current_weather.windspeed +" km/h";

    const row = document.getElementById("forecast");
    row.innerHTML = "";

    data.daily.time.forEach((day, i) => {
        const div = document.createElement("div");
        div.className = "forecast-card";

        const code = data.daily.weathercode[i];

        div.innerHTML = `
        <div class="day-name">${day}</div>
        <div class="icon-box">${weatherCodeMap[code]?.icon || ""}</div>
        <div class="temp-line">
        ${data.daily.temperature_2m_max[i]}° / 
        ${data.daily.temperature_2m_min[i]}°
        </div>
        `;

        row.appendChild(div);
    });
}
const weatherCodeMap = {
    0: { text: "Clear", icon: "☀️" },
    1: { text: "Mainly clear", icon: "🌤️" },
    2: { text: "Partly cloudy", icon: "⛅" },
    3: { text: "Overcast", icon: "☁️" },

    45: { text: "Fog", icon: "🌫️" },
    48: { text: "Fog", icon: "🌫️" },

    51: { text: "Drizzle", icon: "🌦️" },
    53: { text: "Drizzle", icon: "🌦️" },
    55: { text: "Drizzle", icon: "🌦️" },

    61: { text: "Rain", icon: "🌧️" },
    63: { text: "Rain", icon: "🌧️" },
    65: { text: "Heavy rain", icon: "🌧️" },

    80: { text: "Showers", icon: "🌦️" },
    81: { text: "Showers", icon: "🌦️" },
    82: { text: "Heavy showers", icon: "🌧️" },

    95: { text: "Thunderstorm", icon: "⛈️" }
};

function toggleSkeleton(show) {
    const elements = document.querySelectorAll(".value");

    elements.forEach(el => {
        if (show) el.classList.add("skeleton");
        else el.classList.remove("skeleton");
    });
}
function showError(msg) {
    document.getElementById("error").textContent = msg;
}
function getLocalTime(timezone) {

    if (!timezone) {
        document.getElementById("time").textContent =
            new Date().toLocaleString();
        return;
    }

    $.getJSON(`https://worldtimeapi.org/api/timezone/${timezone}`)

        .done(function(data) {
            document.getElementById("time").textContent =
            new Date(data.datetime).toLocaleString()
        })

        .fail(function() {
            document.getElementById("time").textContent =
                new Date().toLocaleString();
        })

        .always(function() {
            console.log("Time request finished:", new Date());
        });
}