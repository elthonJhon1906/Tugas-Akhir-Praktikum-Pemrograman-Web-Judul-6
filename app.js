const config = {
            baseUrl: 'https://api.open-meteo.com/v1/forecast',
            geocodingUrl: 'https://geocoding-api.open-meteo.com/v1/search',
            updateInterval: 5 * 60 * 1000,
            defaultCity: 'Medan'
        };

        const state = {
            currentCity: config.defaultCity,
            temperatureUnit: 'celsius',
            theme: 'light',
            favorites: JSON.parse(localStorage.getItem('favoriteCities')) || [],
            updateTimer: null,
            currentCoords: { lat: -6.2, lon: 106.8 }
        };

        const elements = {
            themeToggle: document.getElementById('theme-toggle'),
            celsiusBtn: document.getElementById('celsius-btn'),
            fahrenheitBtn: document.getElementById('fahrenheit-btn'),
            refreshBtn: document.getElementById('refresh-btn'),
            searchInput: document.getElementById('search-input'),
            autocompleteResults: document.getElementById('autocomplete-results'),
            favoriteCities: document.getElementById('favorite-cities'),
            currentWeather: document.getElementById('current-weather'),
            location: document.getElementById('location'),
            timestamp: document.getElementById('timestamp'),
            weatherCondition: document.getElementById('weather-condition'),
            weatherIcon: document.getElementById('weather-icon'),
            temperature: document.getElementById('temperature'),
            humidity: document.getElementById('humidity'),
            windSpeed: document.getElementById('wind-speed'),
            pressure: document.getElementById('pressure'),
            forecast: document.getElementById('forecast'),
            loading: document.getElementById('loading')
        };

        const themeColorMap = {
            primary: { light: '--text-light-primary', dark: '--text-dark-primary' },
            secondary: { light: '--text-light-secondary', dark: '--text-dark-secondary' },
            contrast: { light: '--text-light-contrast', dark: '--text-dark-contrast' }
        };

        const textThemeElements = {
            'app-title': 'primary',
            'current-weather-title': 'primary',
            'forecast-title': 'primary',
            'favorite-label': 'secondary',
            'location': 'contrast',
            'timestamp': 'contrast',
            'weather-condition': 'contrast',
            'weather-icon': 'contrast',
            'temperature': 'contrast',
            'humidity-label': 'contrast',
            'humidity': 'contrast',
            'wind-label': 'contrast',
            'wind-speed': 'contrast',
            'pressure-label': 'contrast',
            'pressure': 'contrast',
            'loading-message': 'primary'
        };

        function ajaxGet(url) {
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', url, true);
                xhr.onreadystatechange = () => {
                    if (xhr.readyState === XMLHttpRequest.DONE) {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            try {
                                const json = JSON.parse(xhr.responseText);
                                resolve(json);
                            } catch (error) {
                                reject(error);
                            }
                        } else {
                            reject(new Error(`Request failed with status ${xhr.status}`));
                        }
                    }
                };
                xhr.onerror = () => reject(new Error('Network error'));
                xhr.send();
            });
        }

        function init() {
            loadTheme();
            loadFavorites();
            setupEventListeners();
            getWeatherData(state.currentCity);
            startAutoUpdate();
        }

        function setupEventListeners() {
            elements.themeToggle.addEventListener('click', toggleTheme);
            elements.celsiusBtn.addEventListener('click', () => setTemperatureUnit('celsius'));
            elements.fahrenheitBtn.addEventListener('click', () => setTemperatureUnit('fahrenheit'));
            elements.refreshBtn.addEventListener('click', () => getWeatherData(state.currentCity));

            elements.searchInput.addEventListener('input', handleSearchInput);
            elements.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    handleCitySelect(elements.searchInput.value);
                }
            });

            document.addEventListener('click', (e) => {
                if (!elements.searchInput.contains(e.target) && !elements.autocompleteResults.contains(e.target)) {
                    elements.autocompleteResults.classList.add('hidden');
                }
            });
        }

        function toggleTheme() {
            state.theme = state.theme === 'light' ? 'dark' : 'light';
            applyTheme();
            localStorage.setItem('theme', state.theme);

            updateThemeIcon();
        }

        function updateThemeIcon() {
            const moonIcon = elements.themeToggle.querySelector('.fa-moon');
            const sunIcon = elements.themeToggle.querySelector('.fa-sun');

            if (state.theme === 'light') {
                moonIcon.classList.remove('hidden');
                sunIcon.classList.add('hidden');
            } else {
                moonIcon.classList.add('hidden');
                sunIcon.classList.remove('hidden');
            }
        }

        function applyTheme() {
            document.body.classList.toggle('light-mode', state.theme === 'light');
            document.body.classList.toggle('dark-mode', state.theme === 'dark');
            document.documentElement.classList.toggle('dark', state.theme === 'dark');
            updateTextColors();
        }

        function loadTheme() {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme) {
                state.theme = savedTheme;
            }
            applyTheme();
            updateThemeIcon();
        }

        function updateTextColors() {
            const rootStyles = getComputedStyle(document.documentElement);
            const colorCache = {};

            Object.keys(themeColorMap).forEach(tone => {
                const toneMap = themeColorMap[tone];
                const varName = state.theme === 'light' ? toneMap.light : toneMap.dark;
                colorCache[tone] = rootStyles.getPropertyValue(varName).trim();
            });

            Object.entries(textThemeElements).forEach(([id, tone]) => {
                const element = document.getElementById(id);
                if (element && colorCache[tone]) {
                    element.style.color = colorCache[tone];
                }
            });
        }

        function setTemperatureUnit(unit) {
            state.temperatureUnit = unit;

            if (unit === 'celsius') {
                elements.celsiusBtn.classList.add('bg-white', 'dark:bg-slate-700', 'text-slate-900', 'dark:text-slate-100', 'font-medium', 'shadow-sm');
                elements.celsiusBtn.classList.remove('text-slate-500', 'dark:text-slate-400');
                elements.fahrenheitBtn.classList.remove('bg-white', 'dark:bg-slate-700', 'text-slate-900', 'dark:text-slate-100', 'font-medium', 'shadow-sm');
                elements.fahrenheitBtn.classList.add('text-slate-500', 'dark:text-slate-400');
            } else {
                elements.fahrenheitBtn.classList.add('bg-white', 'dark:bg-slate-700', 'text-slate-900', 'dark:text-slate-100', 'font-medium', 'shadow-sm');
                elements.fahrenheitBtn.classList.remove('text-slate-500', 'dark:text-slate-400');
                elements.celsiusBtn.classList.remove('bg-white', 'dark:bg-slate-700', 'text-slate-900', 'dark:text-slate-100', 'font-medium', 'shadow-sm');
                elements.celsiusBtn.classList.add('text-slate-500', 'dark:text-slate-400');
            }

            getWeatherByCoords(state.currentCoords.lat, state.currentCoords.lon, state.currentCity);
        }

        async function handleSearchInput() {
            const query = elements.searchInput.value.trim();

            if (query.length < 2) {
                elements.autocompleteResults.classList.add('hidden');
                return;
            }

            try {
                const suggestions = await getCitySuggestions(query);
                displayAutocompleteResults(suggestions);
            } catch (error) {
                console.error('Error fetching city suggestions:', error);
            }
        }

        async function getCitySuggestions(query) {
            try {
                const data = await ajaxGet(`${config.geocodingUrl}?name=${encodeURIComponent(query)}&count=10&language=id&format=json`);

                if (!data.results) {
                    return [];
                }

                return data.results.map(city => ({
                    name: city.name,
                    country: city.country,
                    lat: city.latitude,
                    lon: city.longitude
                }));
            } catch (error) {
                console.error('Error fetching city data:', error);
                return getStaticCitySuggestions(query);
            }
        }

        function getStaticCitySuggestions(query) {
            const cities = [
                { name: 'Jakarta', country: 'Indonesia', lat: -6.2, lon: 106.8 },
                { name: 'Surabaya', country: 'Indonesia', lat: -7.25, lon: 112.75 },
                { name: 'Bandung', country: 'Indonesia', lat: -6.92, lon: 107.6 },
                { name: 'Medan', country: 'Indonesia', lat: 3.58, lon: 98.67 },
                { name: 'Singapore', country: 'Singapore', lat: 1.29, lon: 103.85 },
                { name: 'Kuala Lumpur', country: 'Malaysia', lat: 3.14, lon: 101.69 },
                { name: 'Bangkok', country: 'Thailand', lat: 13.75, lon: 100.5 },
                { name: 'Manila', country: 'Philippines', lat: 14.6, lon: 120.98 },
                { name: 'Tokyo', country: 'Japan', lat: 35.68, lon: 139.76 },
                { name: 'Seoul', country: 'South Korea', lat: 37.57, lon: 126.98 }
            ];

            return cities.filter(city =>
                city.name.toLowerCase().includes(query.toLowerCase()) ||
                city.country.toLowerCase().includes(query.toLowerCase())
            );
        }

        function displayAutocompleteResults(suggestions) {
            if (suggestions.length === 0) {
                elements.autocompleteResults.classList.add('hidden');
                return;
            }

            elements.autocompleteResults.innerHTML = '';

            suggestions.forEach(city => {
                const item = document.createElement('div');
                item.className = 'p-3 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-200 dark:border-slate-600 last:border-b-0 text-slate-700 dark:text-slate-300 transition-colors';
                item.textContent = `${city.name}, ${city.country}`;
                item.addEventListener('click', () => handleCitySelect(city.name, city.lat, city.lon));
                elements.autocompleteResults.appendChild(item);
            });

            elements.autocompleteResults.classList.remove('hidden');
        }

        function handleCitySelect(cityName, lat, lon) {
            elements.searchInput.value = '';
            elements.autocompleteResults.classList.add('hidden');
            state.currentCoords = { lat, lon };
            getWeatherByCoords(lat, lon, cityName);
        }

        function loadFavorites() {
            updateFavoritesDisplay();
        }

        function updateFavoritesDisplay() {
            const hasFavorites = state.favorites.length > 0;
            elements.favoriteCities.innerHTML = '';
            elements.favoriteCities.dataset.empty = (!hasFavorites).toString();

            if (hasFavorites) {
                const label = document.createElement('span');
                label.id = 'favorite-label';
                label.className = 'text-sm text-slate-600 dark:text-slate-400';
                label.textContent = 'Kota favorit:';
                elements.favoriteCities.appendChild(label);
            }

        state.favorites.forEach(city => {
            const favoriteItem = document.createElement('div');
            favoriteItem.className = 'inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors shadow-sm cursor-pointer';
            favoriteItem.addEventListener('click', () => {
                state.currentCoords = { lat: city.lat, lon: city.lon };
                getWeatherByCoords(city.lat, city.lon, city.name);
            });

            const nameSpan = document.createElement('span');
            nameSpan.textContent = city.name;

            const removeBtn = document.createElement('button');
            removeBtn.className = 'p-1 rounded-full text-slate-500 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-300 transition-colors';
            removeBtn.setAttribute('aria-label', `Hapus ${city.name} dari favorit`);
            removeBtn.innerHTML = '<i class="fas fa-times text-xs"></i>';
            removeBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                removeFavorite(city);
            });

            favoriteItem.appendChild(nameSpan);
            favoriteItem.appendChild(removeBtn);

            elements.favoriteCities.appendChild(favoriteItem);
        });

            const addFavoriteBtn = document.createElement('button');
            addFavoriteBtn.className = `favorite-action-btn inline-flex items-center gap-2 ${hasFavorites ? 'px-3 py-1 text-sm' : 'px-4 py-2 text-base'} border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-full hover:border-blue-500 hover:text-blue-500 dark:hover:border-blue-400 dark:hover:text-blue-200 transition-colors shadow-sm`;
            addFavoriteBtn.innerHTML = `<i class="fas fa-heart-circle-plus"></i><span>${hasFavorites ? 'Tambah' : 'Tambah Kota Favorit'}</span>`;
            addFavoriteBtn.addEventListener('click', addCurrentToFavorites);
            elements.favoriteCities.appendChild(addFavoriteBtn);

            updateTextColors();
        }

        function addCurrentToFavorites() {
            const currentFavorite = {
                name: state.currentCity,
                lat: state.currentCoords.lat,
                lon: state.currentCoords.lon
            };

            const isAlreadyFavorite = state.favorites.some(fav =>
                fav.name === currentFavorite.name && fav.lat === currentFavorite.lat
            );

            if (!isAlreadyFavorite) {
                state.favorites.push(currentFavorite);
                localStorage.setItem('favoriteCities', JSON.stringify(state.favorites));
                updateFavoritesDisplay();

                showNotification('Kota berhasil ditambahkan ke favorit', 'success');
            } else {
                showNotification('Kota sudah ada di favorit', 'warning');
            }
        }

        function removeFavorite(cityToRemove) {
            state.favorites = state.favorites.filter(fav =>
                !(fav.name === cityToRemove.name && fav.lat === cityToRemove.lat && fav.lon === cityToRemove.lon)
            );
            localStorage.setItem('favoriteCities', JSON.stringify(state.favorites));
            updateFavoritesDisplay();
            showNotification('Kota dihapus dari favorit', 'warning');
        }

        function showNotification(message, type) {
            const notification = document.createElement('div');
            notification.className = `fixed top-4 right-4 p-4 rounded-xl shadow-lg z-50 transform transition-transform duration-300 ${type === 'success' ? 'bg-green-500 text-white' :
                    type === 'warning' ? 'bg-amber-500 text-white' :
                        'bg-red-500 text-white'
                }`;
            notification.textContent = message;
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.remove();
            }, 3000);
        }

        async function getWeatherData(cityName) {
            try {
                showLoading();

                const coords = await getCityCoordinates(cityName);
                if (!coords) {
                    throw new Error('Kota tidak ditemukan');
                }

                state.currentCoords = { lat: coords.lat, lon: coords.lon };
                await getWeatherByCoords(coords.lat, coords.lon, coords.name);

            } catch (error) {
                console.error('Error fetching weather data:', error);
                showNotification('Gagal memuat data cuaca. Silakan coba lagi.', 'error');
            } finally {
                hideLoading();
            }
        }

        async function getCityCoordinates(cityName) {
            try {
                const data = await ajaxGet(`${config.geocodingUrl}?name=${encodeURIComponent(cityName)}&count=1&language=id&format=json`);

                if (!data.results || data.results.length === 0) {
                    throw new Error('City not found');
                }

                const city = data.results[0];
                return {
                    name: city.name,
                    country: city.country,
                    lat: city.latitude,
                    lon: city.longitude
                };
            } catch (error) {
                console.error('Error fetching city coordinates:', error);
                const staticCities = getStaticCitySuggestions(cityName);
                return staticCities.length > 0 ? staticCities[0] : null;
            }
        }

        async function getWeatherByCoords(lat, lon, cityName) {
            try {
                showLoading();

                const params = new URLSearchParams({
                    latitude: lat,
                    longitude: lon,
                    current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,pressure_msl,weather_code',
                    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
                    timezone: 'auto',
                    forecast_days: 5
                });

                const data = await ajaxGet(`${config.baseUrl}?${params}`);

                state.currentCity = cityName;

                updateCurrentWeather(data.current, cityName, data.timezone);
                updateForecast(data.daily);

                elements.currentWeather.classList.add('fade-in');
                setTimeout(() => {
                    elements.currentWeather.classList.remove('fade-in');
                }, 500);

            } catch (error) {
                console.error('Error fetching weather data:', error);
                showNotification('Gagal memuat data cuaca. Silakan coba lagi.', 'error');
            } finally {
                hideLoading();
            }
        }

        function updateCurrentWeather(data, cityName, timezone) {
            elements.location.textContent = cityName;

            const date = new Date();
            const formatter = new Intl.DateTimeFormat('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: timezone
            });

            elements.timestamp.textContent = formatter.format(date);

            let temperature = data.temperature_2m;
            if (state.temperatureUnit === 'fahrenheit') {
                temperature = (temperature * 9 / 5) + 32;
            }

            elements.temperature.textContent = `${Math.round(temperature)}°${state.temperatureUnit === 'celsius' ? 'C' : 'F'}`;
            elements.humidity.textContent = `${data.relative_humidity_2m}%`;
            elements.windSpeed.textContent = `${data.wind_speed_10m} km/jam`;
            elements.pressure.textContent = `${data.pressure_msl} hPa`;

            const weatherInfo = getWeatherInfo(data.weather_code);
            elements.weatherCondition.textContent = weatherInfo.condition;
            elements.weatherIcon.textContent = weatherInfo.icon;
        }

        function updateForecast(data) {
            elements.forecast.innerHTML = '';

            for (let i = 0; i < 5; i++) {
                const day = data.time[i];
                const maxTemp = state.temperatureUnit === 'celsius'
                    ? data.temperature_2m_max[i]
                    : (data.temperature_2m_max[i] * 9 / 5) + 32;
                const minTemp = state.temperatureUnit === 'celsius'
                    ? data.temperature_2m_min[i]
                    : (data.temperature_2m_min[i] * 9 / 5) + 32;

                const weatherInfo = getWeatherInfo(data.weather_code[i]);

                const date = new Date(day);
                const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' });
                const formattedDate = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

                const forecastCard = document.createElement('div');
                forecastCard.className = 'bg-white dark:bg-slate-800 rounded-xl p-4 shadow weather-card text-center border border-slate-200 dark:border-slate-700';
                forecastCard.innerHTML = `
                    <div class="font-semibold text-slate-800 dark:text-slate-200">${dayName}</div>
                    <div class="text-sm text-slate-600 dark:text-slate-400 mb-2">${formattedDate}</div>
                    <div class="text-4xl my-3">${weatherInfo.icon}</div>
                    <div class="text-sm mb-2 text-slate-700 dark:text-slate-300">${weatherInfo.condition}</div>
                    <div class="flex justify-center space-x-2">
                        <div class="text-blue-500 font-semibold">${Math.round(maxTemp)}°</div>
                        <div class="text-slate-500 dark:text-slate-400">${Math.round(minTemp)}°</div>
                    </div>
                `;

                elements.forecast.appendChild(forecastCard);
            }
        }

        function getWeatherInfo(code) {
            const weatherMap = {
                0: { condition: 'Cerah', icon: '☀️' },
                1: { condition: 'Sedikit Berawan', icon: '🌤️' },
                2: { condition: 'Berawan', icon: '⛅' },
                3: { condition: 'Mendung', icon: '☁️' },
                45: { condition: 'Kabut', icon: '🌫️' },
                48: { condition: 'Kabut Beku', icon: '🌫️' },
                51: { condition: 'Gerimis Ringan', icon: '🌦️' },
                53: { condition: 'Gerimis', icon: '🌦️' },
                55: { condition: 'Gerimis Lebat', icon: '🌦️' },
                56: { condition: 'Gerimis Beku Ringan', icon: '🌦️' },
                57: { condition: 'Gerimis Beku', icon: '🌦️' },
                61: { condition: 'Hujan Ringan', icon: '🌧️' },
                63: { condition: 'Hujan', icon: '🌧️' },
                65: { condition: 'Hujan Lebat', icon: '🌧️' },
                66: { condition: 'Hujan Beku Ringan', icon: '🌧️' },
                67: { condition: 'Hujan Beku Lebat', icon: '🌧️' },
                71: { condition: 'Salju Ringan', icon: '❄️' },
                73: { condition: 'Salju', icon: '❄️' },
                75: { condition: 'Salju Lebat', icon: '❄️' },
                77: { condition: 'Butiran Salju', icon: '❄️' },
                80: { condition: 'Hujan Ringan', icon: '🌧️' },
                81: { condition: 'Hujan', icon: '🌧️' },
                82: { condition: 'Hujan Lebat', icon: '⛈️' },
                85: { condition: 'Salju Ringan', icon: '❄️' },
                86: { condition: 'Salju Lebat', icon: '❄️' },
                95: { condition: 'Badai Petir', icon: '⛈️' },
                96: { condition: 'Badai Petir dengan Hujan Es Ringan', icon: '⛈️' },
                99: { condition: 'Badai Petir dengan Hujan Es Lebat', icon: '⛈️' }
            };

            return weatherMap[code] || weatherMap[0];
        }

        function showLoading() {
            elements.loading.classList.remove('hidden');
        }

        function hideLoading() {
            elements.loading.classList.add('hidden');
        }

        function startAutoUpdate() {
            state.updateTimer = setInterval(() => {
                getWeatherByCoords(state.currentCoords.lat, state.currentCoords.lon, state.currentCity);
            }, config.updateInterval);
        }

        function stopAutoUpdate() {
            if (state.updateTimer) {
                clearInterval(state.updateTimer);
            }
        }

        document.addEventListener('DOMContentLoaded', init);
