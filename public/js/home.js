
    let count = 0;
    let cart = {};

    testalert = () => {
        count++;
        alert(count);
    }

  
    function addToCart(productId) {
        count++;
        // Use AJAX to call the server-side endpoint
        fetch(`/addToCart?productId=${productId}`, {
            method: 'POST', // or 'GET' depending on your server route
        })
        .then(response => response.json())
        .then(data => {
            console.log(data); // Log the response from the server
            const cartCountSpan = document.getElementById('cartCount');
            if (cartCountSpan) {
                cartCountSpan.textContent = data.cartCount;
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }