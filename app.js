const btn = document.getElementById("searchBtn");
const input = document.getElementById("cityInput");

btn.addEventListener("click", () => {
    const city = input.value.trim();

    if (!city) {
        showError("Please enter a city");
        return;
    }

    fetchWeather(city);
});
async function fetchWeather(city) {
    try {
        showError("");
        toggleSkeleton(true);

        const geoRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${city}`
        );

        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            showError("City not found");
            return;
        }

        const { latitude, longitude, name } = geoData.results[0];

        const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relativehumidity_2m,windspeed_10m&daily=temperature_2m_max,temperature_2m_min,weathercode`
        );

        const weatherData = await weatherRes.json();

        displayWeather(name, weatherData);

    } catch (err) {
        showError("Network error");
    }
}
function displayWeather(city, data) {
    toggleSkeleton(false);

    document.getElementById("cityName").textContent =city;
    document.getElementById("temp").textContent =
        data.current_weather.temperature + "°C";

    document.getElementById("desc").textContent =
        weatherCodeMap[data.current_weather.weathercode]?.text || "Unknown";

    document.getElementById("humidity").textContent ="Loaded";
    document.getElementById("wind").textContent =
        data.current_weather.windspeed +" km/h";

    const row = document.getElementById("forecast");
    row.innerHTML = "";

    data.daily.time.forEach((day, i) => {
        const div = document.createElement("div");
        div.className = "forecast-card";

        const code = data.daily.weathercode[i];

        div.innerHTML = `
            <div>${day}</div>
            <div>${weatherCodeMap[code]?.icon ||""}</div>
            <div>${data.daily.temperature_2m_max[i]} / ${data.daily.temperature_2m_min[i]}</div>
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