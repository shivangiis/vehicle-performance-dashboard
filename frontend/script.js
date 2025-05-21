document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const latestTableBody = document.querySelector('#latest-readings table tbody');
    const refreshLatestButton = document.querySelector('#latest-readings button#refresh-latest');
    const filterButton = document.querySelector('#filter-by-vehicle button#filter-button');
    const filteredTableBody = document.querySelector('#filter-by-vehicle table tbody');
    const vehicleIdFilterInput = document.querySelector('#filter-by-vehicle input#vehicle-id-filter');
    const addForm = document.querySelector('#add-reading form');
    const addMessageDiv = document.querySelector('#add-reading .message');
    const avgTemperatureDiv = document.querySelector('#avg-temperature .metric-value');
    const avgPressureDiv = document.querySelector('#avg-pressure .metric-value');
    const latestReadingDiv = document.querySelector('#latest-reading .metric-value');
    const themeToggle = document.getElementById('theme-toggle');
    const tabButtons = document.querySelectorAll('.tabs button');
    const tabContents = document.querySelectorAll('.tab-content');
    const loginForm = document.getElementById('login-form');
    const loginContainer = document.getElementById('login-container');
    const dashboardContainer = document.getElementById('dashboard-container');
    const togglePassword = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');
    const socialButtons = document.querySelectorAll('.social-btn');
    const loginButton = document.getElementById('login-button');
    const loginSpinner = document.getElementById('login-spinner');
    const loginText = document.getElementById('login-text');
    const logoutButton = document.getElementById('logout-button');
    
    const API_BASE_URL = 'http://localhost:8080/api/sensors';

    // Session timeout variables
    let inactivityTimer;
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

    // Notification variables
    const notificationContainer = document.createElement('div');
    notificationContainer.className = 'notification-container';
    document.body.appendChild(notificationContainer);

    // Alert thresholds
    const alertThresholds = {
        temperature: { warning: 90, critical: 110 },
        pressure: { warningLow: 30, warningHigh: 60 },
        battery: { warning: 11.5, critical: 10.5 },
        speed: { warning: 100, critical: 120 }
    };

    // User preferences
    let userPreferences = {
        theme: 'light',
        notifications: true,
        alertSounds: false,
        refreshInterval: 60 // seconds
    };

    
    const pieChartData = {
        temperature: {
            labels: ['Normal (0-90°C)', 'Warning (90-110°C)', 'Critical (110+°C)'],
            data: [70, 20, 10],
            colors: ['#10B981', '#F59E0B', '#EF4444']
        },
        pressure: {
            labels: ['Normal (30-60 PSI)', 'Low (<30 PSI)', 'High (>60 PSI)'],
            data: [80, 15, 5],
            colors: ['#3B82F6', '#F59E0B', '#EF4444']
        },
        speed: {
            labels: ['0-60 km/h', '60-100 km/h', '100+ km/h'],
            data: [50, 40, 10],
            colors: ['#10B981', '#F59E0B', '#EF4444']
        },
        rpm: {
            labels: ['Idle (<1000 RPM)', 'Normal (1000-3000 RPM)', 'High (>3000 RPM)'],
            data: [30, 60, 10],
            colors: ['#10B981', '#3B82F6', '#EF4444']
        },
        battery: {
            labels: ['Normal (12.6-14.4V)', 'Low (11.5-12.6V)', 'Critical (<11.5V)'],
            data: [85, 10, 5],
            colors: ['#10B981', '#F59E0B', '#EF4444']
        },
        fuel: {
            labels: ['Full (75-100%)', 'Half (25-75%)', 'Low (10-25%)', 'Empty (<10%)'],
            data: [30, 40, 20, 10],
            colors: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444']
        }
        
    };
//     const sensorDistributionSampleData = {
//     labels: ['TEMP', 'PRES', 'BATT', 'SPEED', 'RPM', 'FUEL'],
//     data: [35, 25, 15, 10, 8, 7],
//     colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']
// };

    // Initialize all charts and data
    const initDashboard = () => {
        initPieCharts();
        fetchLatestReadings();
        fetchAllReadingsForAnalytics();
        setupEventListeners();
        
        // Start auto-refresh
        startAutoRefresh();
        
        // Initialize session timeout
        resetInactivityTimer();
        
        // Load user preferences
        loadUserPreferences();
    };

    // Login functionality
    const initLogin = () => {
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }
        
        if (togglePassword && passwordInput) {
            togglePassword.addEventListener('click', togglePasswordVisibility);
        }
        
        if (socialButtons) {
            socialButtons.forEach(button => {
                button.addEventListener('click', handleSocialLogin);
            });
        }
    };

    // Handle login form submission
    const handleLogin = async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        showLoadingState(loginButton, true);
        
        try {
            // Simulate login API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // On successful login
            loginContainer.style.display = 'none';
            dashboardContainer.style.display = 'block';
            showNotification('success', 'Login successful!');
            
            // Initialize dashboard
            initDashboard();
        } catch (error) {
            showNotification('error', 'Login failed. Please try again.');
        } finally {
            showLoadingState(loginButton, false);
        }
    };

    // Toggle password visibility
    const togglePasswordVisibility = () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePassword.classList.toggle('fa-eye-slash');
    };

    // Handle social login
    const handleSocialLogin = (e) => {
        const provider = e.currentTarget.classList.contains('google-btn') ? 'Google' : 'Facebook';
        showLoadingState(e.currentTarget, true);
        
        setTimeout(() => {
            showLoadingState(e.currentTarget, false);
            loginContainer.style.display = 'none';
            dashboardContainer.style.display = 'block';
            showNotification('success', `Logged in with ${provider}`);
            initDashboard();
        }, 2000);
    };

    // Show loading state for buttons
    const showLoadingState = (button, isLoading) => {
        if (button) {
            if (isLoading) {
                button.disabled = true;
                const spinner = button.querySelector('.spinner') || document.createElement('div');
                spinner.className = 'spinner';
                button.innerHTML = '';
                button.appendChild(spinner);
            } else {
                button.disabled = false;
                if (button === loginButton) {
                    button.innerHTML = '<span id="login-text">Login</span>';
                } else {
                    button.textContent = button.dataset.originalText || button.textContent;
                }
            }
        }
    };

    // Show notification
    const showNotification = (type, message) => {
        if (!userPreferences.notifications) return;
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
            <button class="close-notification"><i class="fas fa-times"></i></button>
        `;
        
        notificationContainer.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
        
        // Close button
        notification.querySelector('.close-notification').addEventListener('click', () => {
            notification.remove();
        });
        
        // Play alert sound if enabled
        if (userPreferences.alertSounds && type === 'error') {
            playAlertSound();
        }
    };

    // Play alert sound
    const playAlertSound = () => {
        const audio = new Audio('notification.mp3');
        audio.play().catch(e => console.log('Audio playback failed:', e));
    };

    // Session timeout functionality
    const resetInactivityTimer = () => {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            showNotification('warning', 'You will be logged out due to inactivity');
            setTimeout(logout, 5000);
        }, INACTIVITY_TIMEOUT);
    };

    // Logout function
    const logout = () => {
        // Clear any pending timeouts
        clearTimeout(inactivityTimer);
        
        // Clear any ongoing data refreshes
        clearAllIntervals();
        
        // Reset dashboard state
        resetDashboard();
        
        // Show login screen
        dashboardContainer.style.display = 'none';
        loginContainer.style.display = 'flex';
        
        // Show logout notification
        showNotification('info', 'You have been successfully logged out');
        
        // Reset login form
        if (loginForm) {
            loginForm.reset();
        }
    };

    // Clear all intervals
    const clearAllIntervals = () => {
        const highestIntervalId = setTimeout(() => {}, 0);
        for (let i = 1; i < highestIntervalId; i++) {
            clearInterval(i);
        }
    };

    // Reset dashboard state
    const resetDashboard = () => {
        // Clear tables
        if (latestTableBody) latestTableBody.innerHTML = '';
        if (filteredTableBody) filteredTableBody.innerHTML = '';
        
        // Reset metric cards
        document.querySelectorAll('.metric-value').forEach(el => {
            el.textContent = '--';
            el.removeAttribute('data-previous-value');
        });
        
        // Reset analytics
        if (avgTemperatureDiv) avgTemperatureDiv.textContent = '0°C';
        if (avgPressureDiv) avgPressureDiv.textContent = '0 PSI';
        if (latestReadingDiv) latestReadingDiv.textContent = 'N/A';
    };

    // Auto-refresh data
    const startAutoRefresh = () => {
        if (userPreferences.refreshInterval > 0) {
            setInterval(fetchLatestReadings, userPreferences.refreshInterval * 1000);
        }
    };

    // Load user preferences
    const loadUserPreferences = () => {
        const savedPrefs = localStorage.getItem('dashboardPreferences');
        if (savedPrefs) {
            userPreferences = JSON.parse(savedPrefs);
            
            // Apply theme preference
            if (userPreferences.theme === 'dark') {
                document.body.classList.add('dark-mode');
                if (themeToggle) {
                    const icon = themeToggle.querySelector('i');
                    if (icon) {
                        icon.classList.remove('fa-moon');
                        icon.classList.add('fa-sun');
                    }
                }
            }
        }
    };

    // Save user preferences
    const saveUserPreferences = () => {
        localStorage.setItem('dashboardPreferences', JSON.stringify(userPreferences));
    };

    // Initialize all pie charts
    const initPieCharts = () => {
        createPieChart('temperature-chart', pieChartData.temperature);
        createPieChart('pressure-chart', pieChartData.pressure);
        createPieChart('speed-chart', pieChartData.speed);
        createPieChart('rpm-chart', pieChartData.rpm);
        createPieChart('battery-chart', pieChartData.battery);
        createPieChart('fuel-chart', pieChartData.fuel);
        //  createEmptySensorDistributionChart(sensorDistributionSampleData);
       
    };

    //  const createEmptySensorDistributionChart = () => {
    //     const ctx = document.getElementById('sensor-distribution-chart').getContext('2d');
        
    //     if (window.sensorDistributionChart) {
    //         window.sensorDistributionChart.destroy();
    //     }

    //     window.sensorDistributionChart = new Chart(ctx, {
    //         type: 'pie',
    //         data: {
    //             labels: chartData.labels,
    //             datasets: [{
    //                 data: chartData.data,
    //                 backgroundColor: ['#64748b'],
    //                 borderWidth: 1,
    //                 borderColor: '#fff'
    //             }]
    //         },
    //         options: getPieChartOptions()
    //     });
    // };


     const getPieChartOptions = () => {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 20,
                        font: {
                            family: "'Inter', sans-serif",
                            size: 12
                        }
                         }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 1,
                    padding: 10,
                    cornerRadius: 5,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((acc, data) => acc + data, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                             }
                    }
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true
            }
        };
    };
     
    // Function to create a pie chart
    const createPieChart = (canvasId, chartData) => {
        const ctx = document.getElementById(canvasId).getContext('2d');
        return new Chart(ctx, {
            type: 'pie',
            data: {
                labels: chartData.labels,
                datasets: [{
                    data: chartData.data,
                    backgroundColor: chartData.colors,
                    borderWidth: 1,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            usePointStyle: true,
                            pointStyle: 'circle',
                            padding: 20,
                            font: {
                                family: "'Inter', sans-serif",
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: 'rgba(0, 0, 0, 0.1)',
                        borderWidth: 1,
                        padding: 10,
                        cornerRadius: 5,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((acc, data) => acc + data, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            }
        });
    };

    // Function to fetch and display latest sensor readings
    const fetchLatestReadings = async () => {
        setLoadingState(refreshLatestButton, true);
        try {
            const response = await fetch(`${API_BASE_URL}/latest?limit=10`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            renderTable(latestTableBody, data);
            updateMetricCards(data);
            checkForAlerts(data);
        } catch (error) {
            console.error('Error fetching latest readings:', error);
            latestTableBody.innerHTML = `<tr><td colspan="7" class="error-message">Error loading data.</td></tr>`;
            showNotification('error', 'Failed to fetch latest readings');
        } finally {
            setLoadingState(refreshLatestButton, false);
        }
    };

    // Check for critical readings and show alerts
    const checkForAlerts = (readings) => {
        readings.forEach(reading => {
            const sensorType = reading.sensorId.toLowerCase();
            const value = parseFloat(reading.value);
            
            if (sensorType.includes('temp') && value >= alertThresholds.temperature.critical) {
                showNotification('error', `CRITICAL: High temperature detected (${value}°C)`);
            } 
            else if (sensorType.includes('temp') && value >= alertThresholds.temperature.warning) {
                showNotification('warning', `Warning: High temperature (${value}°C)`);
            }
            else if (sensorType.includes('batt') && value <= alertThresholds.battery.critical) {
                showNotification('error', `CRITICAL: Low battery voltage (${value}V)`);
            }
            else if (sensorType.includes('batt') && value <= alertThresholds.battery.warning) {
                showNotification('warning', `Warning: Low battery voltage (${value}V)`);
            }
            else if (sensorType.includes('speed') && value >= alertThresholds.speed.critical) {
                showNotification('error', `CRITICAL: High speed (${value}km/h)`);
            }
            else if (sensorType.includes('speed') && value >= alertThresholds.speed.warning) {
                showNotification('warning', `Warning: High speed (${value}km/h)`);
            }
        });
    };

    // Function to update metric cards with latest values
    const updateMetricCards = (readings) => {
        readings.forEach(reading => {
            const cardId = getCardIdForSensor(reading.sensorId);
            if (cardId) {
                const card = document.getElementById(cardId);
                if (card) {
                    const valueElement = card.querySelector('.metric-value');
                    const trendElement = card.querySelector('.trend i');
                    
                    // Update value
                    valueElement.textContent = `${reading.value} ${reading.unit}`;
                    
                    // Update trend indicator
                    const previousValue = parseFloat(valueElement.dataset.previousValue) || 0;
                    const currentValue = parseFloat(reading.value);
                    
                    trendElement.className = 'fas ' + 
                        (currentValue > previousValue ? 'fa-arrow-up trend-up' :
                         currentValue < previousValue ? 'fa-arrow-down trend-down' :
                         'fa-minus trend-stable');
                    
                    // Store current value for next comparison
                    valueElement.dataset.previousValue = currentValue;
                    
                    // Highlight critical values
                    if (isCriticalReading(reading)) {
                        card.classList.add('critical');
                        setTimeout(() => card.classList.remove('critical'), 2000);
                    }
                }
            }
        });
    };

    // Check if reading is critical
    const isCriticalReading = (reading) => {
        const sensorType = reading.sensorId.toLowerCase();
        const value = parseFloat(reading.value);
        
        if (sensorType.includes('temp') && value >= alertThresholds.temperature.critical) return true;
        if (sensorType.includes('batt') && value <= alertThresholds.battery.critical) return true;
        if (sensorType.includes('speed') && value >= alertThresholds.speed.critical) return true;
        
        return false;
    };

    // Helper function to map sensor IDs to card IDs
    const getCardIdForSensor = (sensorId) => {
        const sensorLower = sensorId.toLowerCase();
        if (sensorLower.includes('temp')) return 'temp-card';
        if (sensorLower.includes('pres')) return 'pres-card';
        if (sensorLower.includes('batt')) return 'batt-card';
        if (sensorLower.includes('speed')) return 'speed-card';
        return null;
    };

    // Function to fetch and display readings by vehicle ID
    const fetchReadingsByVehicleId = async (vehicleId) => {
        setLoadingState(filterButton, true);
        try {
            const response = await fetch(`${API_BASE_URL}/vehicle?vehicleId=${vehicleId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            renderTable(filteredTableBody, data);
        } catch (error) {
            console.error(`Error fetching readings for vehicle ${vehicleId}:`, error);
            filteredTableBody.innerHTML = `<tr><td colspan="7" class="error-message">Error loading data for vehicle ID.</td></tr>`;
            showNotification('error', `Failed to fetch data for vehicle ${vehicleId}`);
        } finally {
            setLoadingState(filterButton, false);
        }
    };

    // Function to render data in a table with animation
    const renderTable = (tbody, data) => {
        tbody.innerHTML = '';  // Clear previous content
        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="no-data">No data available</td></tr>`;
            return;
        }

        data.forEach((row, index) => {
            const tr = document.createElement('tr');
            tr.style.opacity = '0';
            tr.style.transform = 'translateY(20px)';
            tr.innerHTML = `
                <td>${row.id}</td>
                <td>${row.sensorId}</td>
                <td>${row.value}</td>
                <td>${row.unit}</td>
                <td>${new Date(row.timestamp).toLocaleString()}</td>
                <td>${row.vehicleId}</td>
                <td><span class="status-badge ${getStatusClass(row.status)}">${row.status}</span></td>
            `;
            tbody.appendChild(tr);

            // Animate each row with a staggered delay
            setTimeout(() => {
                tr.style.transition = 'all 0.3s ease-out';
                tr.style.opacity = '1';
                tr.style.transform = 'translateY(0)';
            }, index * 50);
        });
    };

    // Helper function to get CSS class for status
    const getStatusClass = (status) => {
        if (!status) return '';
        const statusLower = status.toLowerCase();
        if (statusLower.includes('normal') || statusLower.includes('ok')) return 'status-good';
        if (statusLower.includes('warning')) return 'status-warning';
        if (statusLower.includes('error') || statusLower.includes('critical')) return 'status-critical';
        return '';
    };

    // Process and render sensor distribution chart
    const processAndRenderSensorDistributionChart = (readings) => {
        
        const sensorTypeCounts = {};
        
        readings.forEach(r => {
            const sensorType = r.sensorId.split('-')[0].toUpperCase();
            sensorTypeCounts[sensorType] = (sensorTypeCounts[sensorType] || 0) + 1;
        });

        const labels = Object.keys(sensorTypeCounts);
        const data = Object.values(sensorTypeCounts);
        const backgroundColors = [
            '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
            '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
        ].slice(0, labels.length);

        const ctx = document.getElementById('sensor-distribution-chart').getContext('2d');
        
        if (window.sensorDistributionChart) {
            window.sensorDistributionChart.destroy();
        }

        window.sensorDistributionChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderWidth: 1,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((acc, data) => acc + data, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            }
        });
    };

    // Fetch all readings for analytics and chart rendering
    const fetchAllReadingsForAnalytics = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            processAndRenderSensorDistributionChart(data);
            updateAnalytics(data.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
        } catch (error) {
            console.error('Error fetching all readings for analytics:', error);
            showNotification('error', 'Failed to fetch analytics data');
        }
    };

    // Function to update the analytics section with animations
    const updateAnalytics = (readings) => {
        const temperatureReadings = readings.filter(r => r.sensorId.toLowerCase().includes('temp'));
        const pressureReadings = readings.filter(r => r.sensorId.toLowerCase().includes('pres'));

        const avgTemperature = temperatureReadings.length > 0
            ? temperatureReadings.reduce((sum, r) => sum + r.value, 0) / temperatureReadings.length
            : 0;

        const avgPressure = pressureReadings.length > 0
            ? pressureReadings.reduce((sum, r) => sum + r.value, 0) / pressureReadings.length
            : 0;

        // Animate the temperature value
        animateValue(avgTemperatureDiv, parseFloat(avgTemperatureDiv.textContent) || 0, avgTemperature, 1000, '°C');

        // Animate the pressure value
        animateValue(avgPressureDiv, parseFloat(avgPressureDiv.textContent) || 0, avgPressure, 1000, ' PSI');

        if (readings.length > 0) {
            const latestReading = readings[0];
            latestReadingDiv.style.opacity = '0';
            latestReadingDiv.style.transform = 'translateY(20px)';
            latestReadingDiv.textContent = `${latestReading.sensorId}: ${latestReading.value} ${latestReading.unit}`;

            setTimeout(() => {
                latestReadingDiv.style.transition = 'all 0.3s ease-out';
                latestReadingDiv.style.opacity = '1';
                latestReadingDiv.style.transform = 'translateY(0)';
            }, 100);
        } else {
            latestReadingDiv.textContent = 'N/A';
        }
    };

    // Helper function to animate numeric values
    const animateValue = (element, start, end, duration, unit) => {
        const range = end - start;
        const increment = range / (duration / 16);
        let current = start;

        const animate = () => {
            current += increment;
            element.textContent = `${current.toFixed(2)}${unit}`;

            if ((increment > 0 && current < end) || (increment < 0 && current > end)) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = `${end.toFixed(2)}${unit}`;
            }
        };

        requestAnimationFrame(animate);
    };

    // Handle adding a new reading
    const handleAddReading = async (event) => {
        event.preventDefault();
        const newReading = {
            sensorId: document.getElementById('sensor-id').value,
            value: parseFloat(document.getElementById('value').value),
            unit: document.getElementById('unit').value,
            vehicleId: document.getElementById('vehicle-id').value,
            status: document.getElementById('status').value || 'Unknown'
        };

        try {
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newReading)
            });

            if (response.ok) {
                showMessage('success', 'Reading added successfully!');
                showNotification('success', 'New sensor reading added');
                fetchLatestReadings();
                fetchAllReadingsForAnalytics();
                addForm.reset();
            } else {
                throw new Error('Failed to add reading');
            }
        } catch (error) {
            showMessage('error', `Error adding reading: ${error.message}`);
            showNotification('error', 'Failed to add reading');
        }
    };

    // Show status message
    const showMessage = (type, text) => {
        addMessageDiv.className = `message ${type}`;
        addMessageDiv.textContent = text;
        setTimeout(() => {
            addMessageDiv.className = 'message';
            addMessageDiv.textContent = '';
        }, 3000);
    };

    // Add loading state to buttons
    const setLoadingState = (button, isLoading) => {
        if (button) {
            if (isLoading) {
                button.disabled = true;
                button.classList.add('loading');
                button.dataset.originalText = button.textContent;
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            } else {
                button.disabled = false;
                button.classList.remove('loading');
                button.textContent = button.dataset.originalText || button.textContent;
            }
        }
    };

    // Setup event listeners
    const setupEventListeners = () => {
        // Button click handlers
        if (refreshLatestButton) refreshLatestButton.addEventListener('click', fetchLatestReadings);
        if (filterButton) filterButton.addEventListener('click', () => {
            const vehicleId = vehicleIdFilterInput.value.trim();
            if (vehicleId) {
                fetchReadingsByVehicleId(vehicleId);
            }
        });
        if (addForm) addForm.addEventListener('submit', handleAddReading);

        // Logout button
        if (logoutButton) {
            logoutButton.addEventListener('click', logout);
        }

        // Theme toggle
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                document.body.classList.toggle('dark-mode');
                userPreferences.theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
                saveUserPreferences();
                
                const icon = themeToggle.querySelector('i');
                if (icon) {
                    icon.classList.toggle('fa-moon');
                    icon.classList.toggle('fa-sun');
                }
            });
        }

        // Tab switching
        if (tabButtons && tabContents) {
            tabButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const tabId = button.dataset.tab;
                    tabButtons.forEach(btn => btn.classList.remove('active'));
                    tabContents.forEach(content => content.classList.remove('active'));
                    button.classList.add('active');
                    document.getElementById(`${tabId}-tab`).classList.add('active');
                });
            });
        }

        // Reset inactivity timer on user activity
        ['mousemove', 'keydown', 'click', 'scroll'].forEach(event => {
            window.addEventListener(event, resetInactivityTimer);
        });

        // Close button for notifications
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-notification') || 
                e.target.closest('.close-notification')) {
                e.target.closest('.notification').remove();
            }
        });
    };

    // Initialize the application
    if (loginContainer && dashboardContainer) {
        initLogin();
    } else {
        initDashboard();
    }
});