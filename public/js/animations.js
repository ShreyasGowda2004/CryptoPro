/**
 * CryptoPro - Advanced Animations and Motion Effects
 * This file contains all animation-related functionality for the crypto trading platform
 */

// Initialize all animations
document.addEventListener('DOMContentLoaded', () => {
    initChartAnimations();
    initUIAnimations();
    initPriceTickerAnimations();
    initLoadingAnimations();
    initTransitionEffects();
});

// ===== CHART ANIMATIONS =====
function initChartAnimations() {
    // Configuration for chart animations
    window.chartAnimationConfig = {
        duration: 500,
        easing: 'easeOutCubic',
        delay: 0,
        responsive: true,
        dynamicDisplay: true,
        animation: {
            duration: 0 // disable animation on resize
        },
        onComplete: function() {
            if (this.tooltip) {
                this.tooltip.contentEl.classList.add('animated', 'fadeIn');
            }
        }
    };
    
    // Apply to all charts on the page
    if (typeof Chart !== 'undefined') {
        Chart.defaults.animation = window.chartAnimationConfig;
        
        // Add custom animation for tooltips
        const originalTooltipDraw = Chart.defaults.plugins.tooltip.callbacks.labelColor;
        Chart.defaults.plugins.tooltip.callbacks.labelColor = function(context) {
            const result = originalTooltipDraw ? originalTooltipDraw.call(this, context) : {
                borderColor: context.dataset.borderColor,
                backgroundColor: context.dataset.backgroundColor
            };
            
            // Add pulse animation to tooltip
            if (this._chart.canvas) {
                this._chart.canvas.style.animation = 'pulse 0.3s';
                setTimeout(() => {
                    if (this._chart.canvas) {
                        this._chart.canvas.style.animation = '';
                    }
                }, 300);
            }
            
            return result;
        };
    }
}

// Create and animate price charts
function createPriceChart(elementId, data, options = {}) {
    const ctx = document.getElementById(elementId);
    if (!ctx) return null;
    
    // Default options for price charts
    const defaultOptions = {
        type: 'line',
        data: {
            labels: data.labels || [],
            datasets: [{
                label: data.label || 'Price',
                data: data.values || [],
                borderColor: data.color || 'rgba(0, 210, 255, 1)',
                backgroundColor: data.backgroundColor || 'rgba(0, 210, 255, 0.1)',
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderWidth: 2,
                tension: 0.3,
                spanGaps: true,
                stepped: false,
                parsing: false, // Disable parsing for better performance
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: window.chartAnimationConfig,
            resizeDelay: 0,
            devicePixelRatio: 1, // Force 1:1 pixel ratio for better performance
            interaction: {
                intersect: false,
                mode: 'index',
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#e2e8f0',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `$${context.parsed.y.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                        }
                    },
                    animation: {
                        duration: 200
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: 'rgba(226, 232, 240, 0.6)',
                        maxRotation: 0
                    }
                },
                y: {
                    display: true,
                    grid: {
                        color: 'rgba(226, 232, 240, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: 'rgba(226, 232, 240, 0.6)',
                        callback: function(value) {
                            return '$' + value.toLocaleString('en-US');
                        }
                    }
                }
            }
        }
    };
    
    // Merge default options with custom options
    const mergedOptions = mergeDeep(defaultOptions, options);
    
    // Create and return the chart
    return new Chart(ctx, mergedOptions);
}

// Update chart with animation
function updateChartData(chart, newData, animate = true) {
    if (!chart) return;
    
    // Update chart data
    chart.data.labels = newData.labels || chart.data.labels;
    chart.data.datasets.forEach((dataset, i) => {
        dataset.data = newData.values || newData.datasets[i]?.data || dataset.data;
    });
    
    // Update with animation
    chart.update(animate ? 'active' : 'none');
}

// ===== UI ANIMATIONS =====
function initUIAnimations() {
    // Add animation classes to elements
    addAnimationClasses();
    
    // Initialize hover effects
    initHoverEffects();
    
    // Initialize scroll animations
    initScrollAnimations();
}

// Add animation classes to elements
function addAnimationClasses() {
    // Add fade-in animation to crypto cards
    document.querySelectorAll('.crypto-card').forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('animate-fade-in');
    });
    
    // Add slide-up animation to sections
    document.querySelectorAll('section').forEach(section => {
        section.classList.add('animate-slide-up');
    });
    
    // Add pulse animation to buttons
    document.querySelectorAll('.btn-primary').forEach(btn => {
        btn.classList.add('animate-pulse');
    });
}

// Initialize hover effects
function initHoverEffects() {
    // Add hover effect to crypto cards
    document.querySelectorAll('.crypto-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.classList.add('hover-effect');
        });
        
        card.addEventListener('mouseleave', () => {
            card.classList.remove('hover-effect');
        });
    });
    
    // Add hover effect to buttons
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.classList.add('btn-hover');
        });
        
        btn.addEventListener('mouseleave', () => {
            btn.classList.remove('btn-hover');
        });
    });
}

// Initialize scroll animations
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });
    
    // Observe elements with animation classes
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });
}

// ===== PRICE TICKER ANIMATIONS =====
function initPriceTickerAnimations() {
    // Create price ticker if it exists
    createPriceTicker();
    
    // Animate price changes
    initPriceChangeAnimations();
}

// Create animated price ticker
function createPriceTicker() {
    const tickerContainer = document.getElementById('price-ticker');
    if (!tickerContainer) return;
    
    // Create ticker content
    const tickerContent = document.createElement('div');
    tickerContent.className = 'ticker-content';
    tickerContainer.appendChild(tickerContent);
    
    // Add ticker animation
    tickerContainer.style.animation = 'ticker-scroll 30s linear infinite';
}

// Animate price changes
function initPriceChangeAnimations() {
    // Animate price changes when they update
    document.addEventListener('priceUpdated', (e) => {
        const { element, oldValue, newValue } = e.detail;
        
        if (!element) return;
        
        // Add animation class based on price change
        if (newValue > oldValue) {
            element.classList.remove('price-down');
            element.classList.add('price-up');
        } else if (newValue < oldValue) {
            element.classList.remove('price-up');
            element.classList.add('price-down');
        }
        
        // Remove animation class after animation completes
        setTimeout(() => {
            element.classList.remove('price-up', 'price-down');
        }, 2000);
    });
}

// Update price with animation
function updatePriceWithAnimation(element, newPrice, oldPrice) {
    if (!element) return;
    
    // Store old price
    const oldPriceValue = oldPrice || parseFloat(element.textContent.replace(/[^0-9.-]+/g, ''));
    
    // Update price
    element.textContent = typeof newPrice === 'number' ? 
        `$${newPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 
        newPrice;
    
    // Dispatch price updated event
    const event = new CustomEvent('priceUpdated', {
        detail: {
            element,
            oldValue: oldPriceValue,
            newValue: parseFloat(newPrice)
        }
    });
    
    document.dispatchEvent(event);
}

// ===== LOADING ANIMATIONS =====
function initLoadingAnimations() {
    // Create loading spinner
    createLoadingSpinner();
    
    // Initialize loading state handlers
    initLoadingStates();
}

// Create loading spinner
function createLoadingSpinner() {
    // Create spinner element if it doesn't exist
    if (!document.getElementById('global-spinner')) {
        const spinner = document.createElement('div');
        spinner.id = 'global-spinner';
        spinner.className = 'loading-spinner';
        spinner.innerHTML = `
            <div class="spinner-ring"></div>
            <div class="spinner-text">Loading...</div>
        `;
        document.body.appendChild(spinner);
    }
}

// Show loading spinner
function showLoadingSpinner() {
    const spinner = document.getElementById('global-spinner');
    if (spinner) {
        spinner.classList.add('active');
    }
}

// Hide loading spinner
function hideLoadingSpinner() {
    const spinner = document.getElementById('global-spinner');
    if (spinner) {
        spinner.classList.remove('active');
    }
}

// Initialize loading state handlers
function initLoadingStates() {
    // Show loading spinner before fetch requests
    const originalFetch = window.fetch;
    window.fetch = function() {
        showLoadingSpinner();
        return originalFetch.apply(this, arguments)
            .finally(() => {
                hideLoadingSpinner();
            });
    };
}

// ===== TRANSITION EFFECTS =====
function initTransitionEffects() {
    // Add page transition effects
    addPageTransitions();
    
    // Initialize modal animations
    initModalAnimations();
}

// Add page transition effects
function addPageTransitions() {
    // Add transition class to body
    document.body.classList.add('page-transition');
    
    // Add event listeners to links for page transitions
    document.querySelectorAll('a').forEach(link => {
        // Skip links that should not trigger page transitions
        if (link.getAttribute('href') && 
            !link.getAttribute('href').startsWith('#') && 
            !link.getAttribute('href').startsWith('javascript:') &&
            !link.getAttribute('target')) {
            
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                
                // Skip if modifier keys are pressed
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                
                // Prevent default navigation
                e.preventDefault();
                
                // Add exit animation
                document.body.classList.add('page-exit');
                
                // Navigate after animation completes
                setTimeout(() => {
                    window.location.href = href;
                }, 300);
            });
        }
    });
    
    // Add entrance animation when page loads
    window.addEventListener('load', () => {
        document.body.classList.add('page-enter');
    });
}

// Initialize modal animations
function initModalAnimations() {
    // Add animation classes to modals
    document.querySelectorAll('.modal').forEach(modal => {
        // Add animation class
        modal.classList.add('animate-modal');
        
        // Add event listeners for bootstrap modal events
        modal.addEventListener('show.bs.modal', () => {
            modal.classList.add('modal-entering');
            modal.classList.remove('modal-leaving');
        });
        
        modal.addEventListener('shown.bs.modal', () => {
            modal.classList.remove('modal-entering');
        });
        
        modal.addEventListener('hide.bs.modal', () => {
            modal.classList.add('modal-leaving');
        });
        
        modal.addEventListener('hidden.bs.modal', () => {
            modal.classList.remove('modal-leaving');
        });
    });
}

// ===== UTILITY FUNCTIONS =====

// Deep merge objects
function mergeDeep(target, source) {
    const isObject = obj => obj && typeof obj === 'object';
    
    if (!isObject(target) || !isObject(source)) {
        return source;
    }
    
    Object.keys(source).forEach(key => {
        const targetValue = target[key];
        const sourceValue = source[key];
        
        if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
            target[key] = targetValue.concat(sourceValue);
        } else if (isObject(targetValue) && isObject(sourceValue)) {
            target[key] = mergeDeep(Object.assign({}, targetValue), sourceValue);
        } else {
            target[key] = sourceValue;
        }
    });
    
    return target;
}

// Generate random price data for demo purposes
function generateRandomPriceData(basePrice, count = 24, volatility = 0.05) {
    const data = {
        labels: [],
        values: []
    };
    
    let currentPrice = basePrice;
    const now = new Date();
    
    for (let i = count - 1; i >= 0; i--) {
        // Generate time label
        const time = new Date(now);
        time.setHours(now.getHours() - i);
        data.labels.push(time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        
        // Generate price value with some randomness
        const change = currentPrice * (Math.random() * volatility * 2 - volatility);
        currentPrice += change;
        data.values.push(Math.max(0, currentPrice));
    }
    
    return data;
}

// Export functions for use in other files
window.CryptoAnimations = {
    createPriceChart,
    updateChartData,
    updatePriceWithAnimation,
    showLoadingSpinner,
    hideLoadingSpinner,
    generateRandomPriceData
};
