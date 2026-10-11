const btn = document.getElementById("darkModeBtn");
    btn.addEventListener("click", () => {
        document.body.classList.toggle("dark");
        // Update button visual text
        if(document.body.classList.contains("dark")) {
            btn.textContent = "☀️ Light Mode";
        } else {
            btn.textContent = "🌙 Dark Mode";
        }
    });

const insertForm = document.getElementById('insert');
insertForm.addEventListener('submit', async(event)=>{
  event.preventDefault();

  const data = {
    sku: document.getElementById('sku').value,
    product_name: document.getElementById('product_name').value,
    category: document.getElementById('category').value,
    price: document.getElementById('price').value,
    stock_quantity: document.getElementById('stock_quantity').value,
    expiration_date: document.getElementById('expiration_date').value
  };
  if(!data.sku || !data.product_name || !data.category || !data.price || !data.stock_quantity){
    alert('Please enter all the required information correctly.');
    return;
  }

  try{
    const response = await fetch('/insert-product', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if(result.ok){
      alert(`${result.message}`);
      insertForm.reset();
    }else{
      alert(`Error occurred: ${result.error}`);
    }
  }catch(error){
    alert('Could not connect to the server.');
  }
});


const viewProducts= document.getElementById('view-products');
viewProducts.addEventListener('submit', async(event)=>{
  event.preventDefault();
  const displayBox= document.getElementById('dashboard');
  try{
    const response = await fetch('/product-list', {method: 'GET'});
    const result = await response.json();

    displayBox.innerHTML = '';

    if(!result.success){
      displayBox.innerHTML = `<b style="color:red;">${result.message}</b>`;
      return;
    }
    else{
      alert('You can view the products.');
      displayBox.innerHTML = `
  <table class="product-table">
    <thead>
      <tr>
        <th>SKU</th>
        <th>Name</th>
        <th>Category</th>
        <th>Price</th>
        <th>Stock</th>
        <th>Expiration</th>
      </tr>
    </thead>

    <tbody>
      ${result.data.map(product => `
        <tr>
          <td>${product.sku}</td>
          <td>${product.product_name}</td>
          <td>${product.category}</td>
          <td>${product.price}</td>
          <td>${product.stock_quantity}</td>
          <td>${product.expiration_date}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>
`;}
  }catch(error){
    alert('Could not display the products.');
  }
});


const updateProduct = document.getElementById('update-products');
updateProduct.addEventListener('submit', async(event)=>{
event.preventDefault();

const data={
  sku: document.getElementById('update_sku').value,
  stock_quantity: document.getElementById('update_stock').value
}
  try{
    const response = await fetch(`/update-products`, {
      method: 'PATCH',
      headers: {'content-type': "application/json"},
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if(!result.success){
      alert(result.message);
    }else{
      alert(result.message);
      updateProduct.reset();
      await checkLowStock();
    }

  }catch(error){
    alert('Could not update data, Please try again later!');
  }
});


const deleteProduct = document.getElementById('delete-product');
deleteProduct.addEventListener('submit', async(event)=>{
  event.preventDefault();
  const sku = document.getElementById('delete_sku').value;
  try{
    const response = await fetch(`/delete-product/${sku}`,
      {method: 'DELETE',});
    const result = await response.json();
      if(!result.success){
        alert(result.message);
      }else{
        alert(result.message);
        deleteProduct.reset();
      }
  }catch(error){
    alert('Could not delete data, Please try again later!');
  }
});


const searchProduct = document.getElementById('search-product');
searchProduct.addEventListener('submit', async(event)=>{
  event.preventDefault();
  const displayBox= document.getElementById('dashboard');
  const category = document.getElementById('search_category').value;
  try{
    const response = await fetch(`/search-product/${category}`, {method: 'GET',});
    const result = await response.json();
    displayBox.innerHTML = '';

    if(!result.success){
      displayBox.innerHTML = `<b style="color:red;">${result.message}</b>`;
      return;
    }
    else{
      searchProduct.reset();
      alert('You can view the category products.');
    displayBox.innerHTML = `
  <table class="product-table">
    <thead>
      <tr>
        <th>SKU</th>
        <th>Name</th>
        <th>Category</th>
        <th>Price</th>
        <th>Stock</th>
        <th>Expiration</th>
      </tr>
    </thead>

    <tbody>
      ${result.data.map(product => `
        <tr>
          <td>${product.sku}</td>
          <td>${product.product_name}</td>
          <td>${product.category}</td>
          <td>${product.price}</td>
          <td>${product.stock_quantity}</td>
          <td>${product.expiration_date}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>
`;}
  }catch(error){
    alert('Could not search the product category.');
  }
});

async function checkLowStock() {
  const alertBox = document.getElementById('low-stock-alert');
  try{
    const response = await fetch('/low-stock-alert', {
      method: 'GET',
    });
    const result = await response.json();
    if(!result.success){
      alertBox.innerHTML = `
      <h2>⚠️ Low Stock Alert</h2>
      <p style="color: green; font-weight: 600;">${result.message}</p>
      `;
      return;
    }
    const alertList = result.data.map(item => `
            <li style="margin: 6px 0;">
                <strong>${item.product_name}</strong> (SKU: ${item.sku}) 
                — <span style="color: #d9534f; font-weight: bold;">${item.stock_quantity} left</span>
            </li>
        `).join('');
    alertBox.innerHTML = `<h2>⚠️ Low Stock Alert</h2>
            <ul style="padding-left: 20px;">
                ${alertList}
            </ul>`;

  }catch(error){
    console.error('Error occurred when finding low stock products:', error);
  }
}


async function checkExpirationDate() {
  const expirationBox = document.getElementById('expiration-alert');
  try{
    const response = await fetch('/expiration-alert', {
      method: 'GET',
    });
    const result = await response.json();
    if(!result.success){
      expirationBox.innerHTML = `<h2>⏳ Expiration Alert</h2>
                <p style="color: green; font-weight: 600;">${result.message}</p>`;
                return;
    }
    const expiredList = result.data.map(item =>{
      const formattedDate = new Date(item.expiration_date).toISOString().split('T')[0];
      return`
            <li style="margin: 6px 0;">
                <strong>${item.product_name}</strong> (SKU: ${item.sku}) 
                — <span style="color: #d9534f; font-weight: bold;">Expires on: ${formattedDate}</span>
            </li>`;
    }).join('');
    expirationBox.innerHTML = `<h2>⏳ Expiration Alert</h2>
            <ul style="padding-left: 20px;">
                ${expiredList}
            </ul>`;
  }catch(error){
    console.error('Error occurred when finding expiring products:', error);
  }
}
document.addEventListener('DOMContentLoaded', ()=>{
  checkLowStock();
  checkExpirationDate();
});