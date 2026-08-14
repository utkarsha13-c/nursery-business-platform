CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT users_role_check
        CHECK (role IN ('CUSTOMER', 'ADMIN'))
);


CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id)
        ON DELETE SET NULL,

    name VARCHAR(150) NOT NULL,
    description TEXT,

    price NUMERIC(10,2) NOT NULL,
    unit VARCHAR(50) DEFAULT 'sapling',

    stock_quantity INTEGER NOT NULL DEFAULT 0,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT products_price_check
        CHECK (price >= 0),

    CONSTRAINT products_stock_check
        CHECK (stock_quantity >= 0)
);


CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,

    product_id INTEGER NOT NULL
        REFERENCES products(id)
        ON DELETE CASCADE,

    image_url TEXT NOT NULL,

    is_primary BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,

    product_id INTEGER NOT NULL
        REFERENCES products(id)
        ON DELETE CASCADE,

    quantity INTEGER NOT NULL,

    movement_type VARCHAR(20) NOT NULL,

    note TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT inventory_movement_check
        CHECK (movement_type IN ('RESTOCK', 'SALE', 'ADJUSTMENT'))
);


CREATE TABLE addresses (
    id SERIAL PRIMARY KEY,

    user_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    address_line TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,

    is_default BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE requests (
    id SERIAL PRIMARY KEY,

    customer_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',

    message TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT requests_status_check
        CHECK (
            status IN (
                'PENDING',
                'REVIEWING',
                'QUOTED',
                'APPROVED',
                'REJECTED',
                'COMPLETED'
            )
        )
);


CREATE TABLE request_items (
    id SERIAL PRIMARY KEY,

    request_id INTEGER NOT NULL
        REFERENCES requests(id)
        ON DELETE CASCADE,

    product_id INTEGER NOT NULL
        REFERENCES products(id)
        ON DELETE CASCADE,

    quantity INTEGER NOT NULL,

    CONSTRAINT request_quantity_check
        CHECK (quantity > 0)
);


CREATE TABLE orders (
    id SERIAL PRIMARY KEY,

    customer_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',

    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT orders_status_check
        CHECK (
            status IN (
                'PENDING',
                'CONFIRMED',
                'PROCESSING',
                'SHIPPED',
                'DELIVERED',
                'CANCELLED'
            )
        )
);


CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,

    order_id INTEGER NOT NULL
        REFERENCES orders(id)
        ON DELETE CASCADE,

    product_id INTEGER NOT NULL
        REFERENCES products(id)
        ON DELETE RESTRICT,

    quantity INTEGER NOT NULL,

    price NUMERIC(10,2) NOT NULL,

    subtotal NUMERIC(12,2) NOT NULL,

    CONSTRAINT order_quantity_check
        CHECK (quantity > 0),

    CONSTRAINT order_price_check
        CHECK (price >= 0)
);