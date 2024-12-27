const peer = new Peer();
let connections = [];
let processedUpdates = new Set();
let cart = [];

const peerIdInput = document.getElementById("peer-id");
const copyIdButton = document.getElementById("generate-id");
const connectIdInput = document.getElementById("connect-id");
const connectButton = document.getElementById("connect-btn");
const productButtons = document.querySelectorAll(".product-btn");
const cartList = document.getElementById("cart");
const openCartBtn = document.getElementById("open-cart-btn");
const closeCartBtn = document.getElementById("close-cart-btn");
const cartContainer = document.getElementById("cart-container");
const cartCounter = document.getElementById("cart-counter");

function generateUUID() {
  return `${Date.now()}-${Math.random()}`;
}

function updateCartCounter() {
  cartCounter.textContent = cart.length;
}

function renderCart() {
  cartList.innerHTML = "";
  cart.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item.title;

    const img = document.createElement("img");
    img.src = item.image;
    img.alt = item.title;
    img.style.width = "50px";

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remover";
    removeBtn.className = "cart-item-remove";
    removeBtn.addEventListener("click", () => {
      removeFromCart(item.uuid);
    });

    li.prepend(img);
    li.appendChild(removeBtn);
    cartList.appendChild(li);
  });

  updateCartCounter();
}

function addToCart(product) {
  const uuid = generateUUID();
  const newItem = { ...product, uuid };
  cart.push(newItem);
  renderCart();
  sendCartToPeers();
}

function removeFromCart(uuid) {
  cart = cart.filter((item) => item.uuid !== uuid);
  renderCart();
  sendCartToPeers();
}

function updateCartFromData(receivedCart) {
  cart = receivedCart;
  renderCart();
}

function sendCartToPeers() {
  const updateId = generateUUID();
  processedUpdates.add(updateId);
  connections.forEach((conn) => {
    if (conn.open) {
      conn.send({ cart, updateId });
    }
  });
}

function sendCartToPeer(connection) {
  const updateId = generateUUID();
  processedUpdates.add(updateId);
  if (connection.open) {
    connection.send({ cart, updateId, type: "sync" });
  }
}

function broadcastCart(receivedCart, updateId, senderConnection) {
  connections.forEach((conn) => {
    if (conn !== senderConnection && conn.open) {
      conn.send({ cart: receivedCart, updateId });
    }
  });
}

function setupConnection(connection) {
  connections.push(connection);

  connection.on("open", () => {
    sendCartToPeer(connection);
  });

  connection.on("data", (data) => {
    if (data.cart && data.updateId) {
      if (!processedUpdates.has(data.updateId)) {
        processedUpdates.add(data.updateId);

        if (data.type === "sync") {
          const mergedCart = [...new Set([...cart, ...data.cart])];
          updateCartFromData(mergedCart);
          broadcastCart(mergedCart, data.updateId, connection);
        } else {
          updateCartFromData(data.cart);
          broadcastCart(data.cart, data.updateId, connection);
        }
      }
    }
  });

  connection.on("close", () => {
    connections = connections.filter((conn) => conn !== connection);
  });
}

peer.on("open", (id) => {
  peerIdInput.value = id;
});

copyIdButton.addEventListener("click", () => {
  navigator.clipboard.writeText(peerIdInput.value).then(() => {
    document.getElementById("generate-id").textContent = "Copiado!";
  });
});

connectButton.addEventListener("click", () => {
  const connectId = connectIdInput.value;
  if (connectId) {
    const conn = peer.connect(connectId);
    setupConnection(conn);
  } else {
    alert("Por favor, verifique o ID inserido.");
  }
});

peer.on("connection", (incomingConn) => {
  setupConnection(incomingConn);
});

openCartBtn.addEventListener("click", () => {
  cartContainer.classList.remove("hidden");
});

closeCartBtn.addEventListener("click", () => {
  cartContainer.classList.add("hidden");
});

const products = [
    {
      title: "Notebook Gamer Lenovo LOQ Intel Core i5-12450H 16GB 512GB SSD RTX 2050 15.6\" FHD W11 83EU0001BR",
      image: "https://m.media-amazon.com/images/I/61E5hcB0lIL._AC_SX522_.jpg",
      price: "R$4.074,60",
      url: "https://amzn.to/4gyduhq",
    },
    {
      title: "Fone de Ouvido Headset Gamer Havit Fuxi-H3 Black, Quad-Mode Com Fio e Sem Fio, Wireless 2,4GHz, Bluetooth, Cabo USB-C, Cabo 3,5mm. Surround, Baixa Latência",
      image: "https://m.media-amazon.com/images/I/71g1gS6qGmL._AC_SX679_.jpg",
      price: "R$212,90",
      url: "https://amzn.to/4gsSuss",
    },
    {
      title: "Headphone Fone de Ouvido Havit HV-H2002d, Gamer, com Microfone, Falante 53mm, Plug 3.5mm",
      image: "https://m.media-amazon.com/images/I/71i5jjOyOEL._AC_SX679_.jpg",
      price: "R$209,00",
      url: "https://amzn.to/408sAEC",
    },
    {
      title: "Base De Carregamento Do Dualsense",
      image: "https://m.media-amazon.com/images/I/41xfd4g3PZL._AC_SX679_.jpg",
      price: "R$180,90",
      url: "https://amzn.to/3ZVKKIA",
    },
    {
      title: "Bolsa Maleta Case Transporte Mario Para Nintendo Switch",
      image: "https://m.media-amazon.com/images/I/81hpq97sJoL._AC_SX679_.jpg",
      price: "R$70,00",
      url: "https://amzn.to/3Dw5Wxn",
    },
    {
      title: "Pen Drive Twist 64GB USB Leitura 10MB/s e Gravação 3MB/s Preto Multilaser",
      image: "https://m.media-amazon.com/images/I/41btK80wr4L._AC_SX522_.jpg",
      price: "R$29,90",
      url: "https://amzn.to/3VVPnkE",
    },
  ];


const productGrid = document.getElementById("products");
products.forEach((product) => {
  const productCard = document.createElement("div");
  productCard.className = "product-card";

  productCard.innerHTML = `
    <img src="${product.image}" alt="${product.title}">
    <div class="product-card-content">
      <div class="product-card-title">
        <a href="${product.url}" target="_blank">${product.title}</a>
      </div>
      <div class="product-card-price">${product.price}</div>
      <button class="add-to-cart-btn">Adicionar ao carrinho</button>
    </div>
  `;

  const addToCartBtn = productCard.querySelector(".add-to-cart-btn");
  addToCartBtn.addEventListener("click", () => {
    addToCart(product);
  });

  productGrid.appendChild(productCard);
});

