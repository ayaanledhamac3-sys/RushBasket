import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiArrowLeft, FiChevronDown, FiChevronUp, FiPlus, FiMinus, FiX, FiSearch } from 'react-icons/fi';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext';
import { groceryData } from '../assets/dummyDataItem';
import { itemsPageStyles } from '../assets/dummyStyles';
import { API_BASE } from '../apiConfig';

const ProductCard = ({ item }) => {
  const { addToCart, removeFromCart, updateQuantity, cart } = useCart();

  const productId = item._id;
  const cartItem = cart.find(ci => ci.productId === productId);
  const lineId = cartItem?.id;
  const quantity = cartItem?.quantity || 0;

  const handleAddToCart = () => addToCart(productId, 1);
  const handleIncrement = () => updateQuantity(lineId, quantity + 1);
  const handleDecrement = () => {
    if (quantity <= 1) removeFromCart(lineId);
    else updateQuantity(lineId, quantity - 1);
  };

  const rawImage = item.image || item.imageUrl;
  let imgSrc = item.image;
  if (rawImage) {
    if (rawImage.startsWith('http')) imgSrc = rawImage;
    else if (rawImage.startsWith('/')) imgSrc = `${API_BASE}${rawImage}`;
    else imgSrc = `${API_BASE}/uploads/${rawImage}`;
  }

  return (
    <div className={itemsPageStyles.productCard}>
      <div className={itemsPageStyles.imageContainer}>
        <img
          src={imgSrc}
          className={itemsPageStyles.productImage}
          alt={item.name}
        />
      </div>
      <div className={itemsPageStyles.cardContent}>
        <div className={itemsPageStyles.titleContainer}>
          <h3 className={itemsPageStyles.productTitle}>{item.name}</h3>
        </div>
        <p className={itemsPageStyles.productDescription}>
          {item.description || `Fresh organic ${item.name.toLowerCase()} sourced locally`}
        </p>
        <div className={itemsPageStyles.priceContainer}>
          <span className={itemsPageStyles.currentPrice}>${item.price.toFixed(2)}</span>
          <span className={itemsPageStyles.oldPrice}>${(item.price * 1.15).toFixed(2)}</span>
        </div>
        <div className="mt-3">
          {quantity > 0 ? (
            <div className={itemsPageStyles.quantityControls}>
              <button onClick={handleDecrement} className={`${itemsPageStyles.quantityButton} ${itemsPageStyles.quantityButtonLeft}`}><FiMinus /></button>
              <span className={itemsPageStyles.quantityValue}>{quantity}</span>
              <button onClick={handleIncrement} className={`${itemsPageStyles.quantityButton} ${itemsPageStyles.quantityButtonRight}`}><FiPlus /></button>
            </div>
          ) : (
            <button onClick={handleAddToCart} className={itemsPageStyles.addButton}>
              <span>Add to Cart</span>
              <span className={itemsPageStyles.addButtonArrow}>→</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};


const Items = () => {
  const [expandedCategories, setExpandedCategories] = useState({});
  const [allExpanded, setAllExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState(groceryData);
  const location = useLocation();
  const navigate = useNavigate();

  // Read search query from URL
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const search = queryParams.get('search');
    if (search) setSearchTerm(search);
  }, [location]);

  // Fetch from backend and override static data
  useEffect(() => {
    axios
      .get(`${API_BASE}/api/items`)
      .then(res => {
        const products = Array.isArray(res.data)
          ? res.data
          : res.data.products || [];
        // group into categories
        const grouped = products.reduce((acc, item) => {
          const cat = item.category || 'Uncategorized';
          if (!acc[cat]) acc[cat] = { id: cat, name: cat, items: [] };
          acc[cat].items.push(item);
          return acc;
        }, {});
        setData(Object.values(grouped));
      })
      .catch(err => console.error('Fetch error:', err));
  }, []);

  const itemMatchesSearch = (item, term) => {
    if (!term) return true;
    const cleanTerm = term.trim().toLowerCase();
    const searchWords = cleanTerm.split(/\s+/);
    return searchWords.every(word => item.name.toLowerCase().includes(word));
  };

  const filteredData = searchTerm
    ? data
      .map(category => ({
        ...category,
        items: category.items.filter(item => itemMatchesSearch(item, searchTerm))
      }))
      .filter(category => category.items.length > 0)
    : data;

  const clearSearch = () => {
    setSearchTerm('');
    navigate('/items');
  };

  const toggleCategory = categoryId => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const toggleAllCategories = () => {
    if (allExpanded) {
      setExpandedCategories({});
    } else {
      const expanded = {};
      data.forEach(category => {
        expanded[category.id] = true;
      });
      setExpandedCategories(expanded);
    }
    setAllExpanded(!allExpanded);
  };

  return (
    <div className={itemsPageStyles.page}>
      <div className={itemsPageStyles.container}>
        <header className={itemsPageStyles.header}>
          <Link to="/" className={itemsPageStyles.backLink}>
            <FiArrowLeft className="mr-2" />
            <span>Back</span>
          </Link>

          <h1 className={itemsPageStyles.mainTitle}>
            <span className={itemsPageStyles.titleSpan}>ORGANIC</span> PANTRY
          </h1>

          <p className={itemsPageStyles.subtitle}>
            Premium quality groceries sourced from local organic farms
          </p>

          <div className={itemsPageStyles.titleDivider}>
            <div className={itemsPageStyles.dividerLine}></div>
          </div>
        </header>

        {/* Search Bar */}
        <div className={itemsPageStyles.searchContainer}>
          <form
            onSubmit={e => {
              e.preventDefault();
              if (searchTerm.trim()) {
                navigate(`/items?search=${encodeURIComponent(searchTerm)}`);
              }
            }}
            className={itemsPageStyles.searchForm}
          >
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search fruits, vegetables, meats..."
              className={itemsPageStyles.searchInput}
            />
            <button type="submit" className={itemsPageStyles.searchButton}>
              <FiSearch className="h-5 w-5" />
            </button>
          </form>
        </div>

        <div className="flex justify-center mb-10">
          <button
            onClick={toggleAllCategories}
            className={itemsPageStyles.expandButton}
          >
            <span className="mr-2 font-medium">
              {allExpanded ? 'Collapse All' : 'Expand All'}
            </span>
            {allExpanded ? <FiChevronUp /> : <FiChevronDown />}
          </button>
        </div>

        {filteredData.length > 0 ? (
          filteredData.map(category => {
            const isExpanded = expandedCategories[category.id] || allExpanded;
            const visibleItems = isExpanded
              ? category.items
              : category.items.slice(0, 4);
            const hasMoreItems = category.items.length > 4;

            return (
              <section
                key={category.id}
                className={itemsPageStyles.categorySection}
              >
                <div className={itemsPageStyles.categoryHeader}>
                  <div className={itemsPageStyles.categoryIcon}></div>
                  <h2 className={itemsPageStyles.categoryTitle}>
                    {category.name}
                  </h2>
                  <div className={itemsPageStyles.categoryDivider}></div>
                </div>

                <div className={itemsPageStyles.productsGrid}>
                  {visibleItems.map(item => (
                    <ProductCard key={`${category.id}-${item._id || item.id || item.name}`} item={item} />
                  ))}
                </div>

                {hasMoreItems && (
                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className={itemsPageStyles.showMoreButton}
                    >
                      <span className="mr-2 font-medium">
                        {isExpanded
                          ? `Show Less ${category.name}`
                          : `Show More ${category.name} (${category.items.length - 4
                          }+)`}
                      </span>
                      {isExpanded ? (
                        <FiChevronUp className="text-lg" />
                      ) : (
                        <FiChevronDown className="text-lg" />
                      )}
                    </button>
                  </div>
                )}
              </section>
            );
          })
        ) : (
          <div className={itemsPageStyles.noProductsContainer}>
            <div className={itemsPageStyles.noProductsCard}>
              <div className={itemsPageStyles.noProductsIcon}>
                <FiSearch className="mx-auto h-16 w-16" />
              </div>
              <h3 className={itemsPageStyles.noProductsTitle}>
                No products found
              </h3>
              <p className={itemsPageStyles.noProductsText}>
                We couldn't find any items matching "{searchTerm}"
              </p>
              <button
                onClick={clearSearch}
                className={itemsPageStyles.clearSearchButton}
              >
                Clear Search
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Items;
