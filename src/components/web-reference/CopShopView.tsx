
import React, { useState } from 'react';
import { ShoppingCart, Wallet, CreditCard, Search, Plus, Minus, Trash2, CheckCircle, Package, Shield, Star, Filter, X, History, TrendingUp, DollarSign, Fuel, FileText, ClipboardList, Truck, QrCode, AlertCircle, Printer, Boxes, ChevronRight } from 'lucide-react';

// --- TYPES ---
interface Product {
  id: string;
  name: string;
  category: 'UNIFORM' | 'TACTICAL GEARS' | 'ELECTRONICS' | 'SUPPLIES' | 'SPARE PARTS' | 'E-BOOKS' | 'MISCELLANEOUS';
  price: number;
  image: string;
  rating: number;
  stock: number;
}

interface CartItem extends Product {
  quantity: number;
}

interface Transaction {
  id: string;
  type: 'DEBIT' | 'CREDIT';
  amount: number;
  description: string;
  date: Date;
}

interface MemorandumReceipt {
    id: string;
    item: string;
    serial: string;
    dateIssued: string;
    status: 'ACTIVE' | 'RETURNED' | 'EXPIRED';
    value: number;
}

interface SupplyRequest {
    id: string;
    item: string;
    qty: number;
    unit: string;
    date: string;
    status: 'PENDING' | 'APPROVED' | 'RELEASED';
}

// --- MOCK DATA ---
const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Leatherman Signal', category: 'TACTICAL GEARS', price: 953.00, rating: 4.9, stock: 25, image: 'https://images.leatherman.com/dw/image/v2/BJQM_PRD/on/demandware.static/-/Sites-master/default/dwb7d72776/products/Signal/Signal_Silver_Hero.png' },
  { id: 'p2', name: 'Outdoor Chest Bag', category: 'TACTICAL GEARS', price: 56.69, rating: 4.5, stock: 60, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'p3', name: 'Tactical Garmin Watch', category: 'ELECTRONICS', price: 132.23, rating: 4.7, stock: 15, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'p4', name: 'Large Molle Sheath', category: 'TACTICAL GEARS', price: 113.00, rating: 4.6, stock: 40, image: 'https://images.unsplash.com/photo-1620311266014-9989a3d6d073?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'p5', name: 'Outdoor Camping Flashlight', category: 'ELECTRONICS', price: 87.71, rating: 4.6, stock: 90, image: 'https://images.unsplash.com/photo-1593305961017-f7057a6e138a?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'p6', name: 'WUBEN X4 EDC Flashlight', category: 'ELECTRONICS', price: 159.99, rating: 4.8, stock: 85, image: 'https://images.unsplash.com/photo-1579294273836-e8bed8a405a7?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'p7', name: 'Mobile Navigation', category: 'ELECTRONICS', price: 20.19, rating: 4.2, stock: 100, image: 'https://images.unsplash.com/photo-1575089976121-8ed7b2a54265?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'p8', name: '12-in-1 Survival Kit', category: 'SUPPLIES', price: 91.80, rating: 4.8, stock: 50, image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'p9', name: 'Tactical Molle Pouch', category: 'TACTICAL GEARS', price: 70.00, rating: 4.4, stock: 110, image: 'https://images.unsplash.com/photo-1474936336328-9844e13da327?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'p10', name: 'Platatac Combat Jacket', category: 'UNIFORM', price: 300.00, rating: 4.7, stock: 20, image: 'https://platatac.com/media/catalog/product/cache/1/image/600x600/9df78eab33525d08d6e5fb8d27136e95/t/a/tactical-jacket.jpg' },
  { id: 'p11', name: 'VT-8280 Tactical Vest', category: 'TACTICAL GEARS', price: 450.00, rating: 4.9, stock: 10, image: 'https://images.unsplash.com/photo-1601646272559-0096570c9103?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: 'p12', name: '5.11 Tactical Parka', category: 'UNIFORM', price: 500.00, rating: 4.6, stock: 15, image: 'https://www.511tactical.com/media/catalog/product/5/0/50865_019_01.jpg' },
];

const MY_MRS: MemorandumReceipt[] = [
    { id: 'MR-001', item: 'Glock 17 Gen 4', serial: 'PNP-G17-8821', dateIssued: '2020-05-15', status: 'ACTIVE', value: 45000 },
    { id: 'MR-002', item: 'Motorola APX Radio', serial: 'MOT-99221', dateIssued: '2021-02-10', status: 'ACTIVE', value: 35000 },
    { id: 'MR-003', item: 'Lvl IIIA Vest', serial: 'VST-2022-005', dateIssued: '2022-08-20', status: 'ACTIVE', value: 25000 },
];

const FUEL_TXNS = [
    { id: 'F-1', date: 'Oct 24', station: 'Shell - Q.Ave', liters: 45, amount: 2800 },
    { id: 'F-2', date: 'Oct 20', station: 'Petron - EDSA', liters: 30, amount: 1950 },
];

const CATEGORIES = ['ALL', 'UNIFORM', 'TACTICAL GEARS', 'ELECTRONICS', 'SUPPLIES', 'SPARE PARTS', 'E-BOOKS', 'MISCELLANEOUS'];

const ProductCard: React.FC<{ product: Product; onAdd: (p: Product) => void }> = ({ product, onAdd }) => (
  <div className="w-24 h-48 bg-slate-800 border border-slate-700 rounded-lg p-1.5 hover:border-blue-500 transition-all group flex flex-col relative overflow-hidden shadow-sm hover:shadow-md hover:shadow-blue-900/20 shrink-0">
      {/* 1 Inch Width (~96px) by 2 Inches Height (~192px) */}
      <div className="w-full aspect-square mx-auto bg-slate-900 rounded-md overflow-hidden border border-slate-600 relative shrink-0 mb-1.5 shadow-inner">
          <img src={product.image} alt={product.name} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-90 group-hover:opacity-100" />
          <div className="absolute bottom-0 right-0 bg-black/70 backdrop-blur-md px-1 py-0.5 rounded-tl text-[5px] font-bold text-white flex items-center gap-0.5">
              <Star className="w-1.5 h-1.5 text-yellow-500 fill-yellow-500" /> {product.rating}
          </div>
      </div>
      
      <div className="flex flex-col flex-1 text-center min-h-0">
          <div className="text-[6px] text-blue-400 font-bold uppercase mb-0.5 tracking-wider truncate w-full">{product.category}</div>
          <h3 className="text-[8px] font-bold text-slate-100 leading-tight mb-1 line-clamp-3 overflow-hidden">{product.name}</h3>
          
          <div className="mt-auto w-full">
              <div className="flex justify-center items-baseline gap-0.5 mb-1">
                  <span className="text-[7px] text-slate-400">$</span>
                  <span className="text-xs font-black text-white">{product.price.toFixed(2)}</span>
              </div>
              <button 
                onClick={() => onAdd(product)}
                className="w-full bg-slate-700 hover:bg-blue-600 text-white text-[7px] font-bold py-1 rounded transition-colors flex items-center justify-center gap-1 active:scale-95 uppercase tracking-wide border border-slate-600 hover:border-blue-500"
              >
                  <Plus className="w-2 h-2" /> Add
              </button>
          </div>
      </div>
  </div>
);

const CopShopView: React.FC = () => {
  // Mode State
  const [viewMode, setViewMode] = useState<'STORE' | 'LOGISTICS'>('STORE');

  // Store State
  const [walletBalance, setWalletBalance] = useState(2500.00);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Logistics State
  const [reqItem, setReqItem] = useState('');
  const [reqQty, setReqQty] = useState('');
  const [reqHistory, setReqHistory] = useState<SupplyRequest[]>([
      { id: 'RQ-101', item: 'Bond Paper (A4)', qty: 5, unit: 'Reams', date: 'Oct 20', status: 'APPROVED' },
      { id: 'RQ-102', item: 'Printer Ink (Black)', qty: 2, unit: 'Cart', date: 'Oct 22', status: 'PENDING' },
  ]);
  
  // UI Panels
  const [showWallet, setShowWallet] = useState(false);
  const [showCart, setShowCart] = useState(false); // Only for mobile now
  const [checkoutStatus, setCheckoutStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS'>('IDLE');

  // Calculated
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const filteredProducts = MOCK_PRODUCTS.filter(p => {
      const matchCat = activeCategory === 'ALL' || p.category === activeCategory;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
  });

  // Actions
  const addToCart = (product: Product) => {
      setCart(prev => {
          const existing = prev.find(item => item.id === product.id);
          if (existing) {
              return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
          }
          return [...prev, { ...product, quantity: 1 }];
      });
      if (navigator.vibrate) navigator.vibrate(50);
  };

  const removeFromCart = (productId: string) => {
      setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
      setCart(prev => prev.map(item => {
          if (item.id === productId) {
              const newQty = Math.max(1, item.quantity + delta);
              return { ...item, quantity: newQty };
          }
          return item;
      }));
  };

  const handleCheckout = async () => {
      if (walletBalance < cartTotal) {
          alert("Insufficient funds in E-Wallet.");
          return;
      }

      setCheckoutStatus('PROCESSING');
      
      // Simulate API call
      setTimeout(() => {
          setWalletBalance(prev => prev - cartTotal);
          setCart([]);
          setCheckoutStatus('SUCCESS');

          setTimeout(() => {
              setCheckoutStatus('IDLE');
              setShowCart(false);
          }, 2000);
      }, 1500);
  };

  const submitRequisition = () => {
      if (!reqItem || !reqQty) return;
      const newReq: SupplyRequest = {
          id: `RQ-${Date.now().toString().slice(-4)}`,
          item: reqItem,
          qty: parseInt(reqQty),
          unit: 'Pcs',
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          status: 'PENDING'
      };
      setReqHistory([newReq, ...reqHistory]);
      setReqItem('');
      setReqQty('');
      alert("Supply Requisition Submitted to Logistics Division.");
  };

  // Reusable Cart Content
  const CartContent = () => (
      <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                      <ShoppingCart className="w-12 h-12 mb-3 opacity-20" />
                      <p className="text-xs">Cart is empty.</p>
                  </div>
              ) : (
                  cart.map(item => (
                      <div key={item.id} className="flex gap-2 bg-slate-800 p-2 rounded-lg border border-slate-700 animate-in slide-in-from-right-2">
                          <img src={item.image} alt="" referrerPolicy="no-referrer" className="w-12 h-12 object-cover rounded bg-slate-900 shrink-0" />
                          <div className="flex-1 min-w-0">
                              <div className="text-[10px] font-bold text-white truncate">{item.name}</div>
                              <div className="text-[9px] text-blue-400 font-mono mb-1">${item.price.toFixed(2)}</div>
                              <div className="flex items-center gap-2">
                                  <div className="flex items-center bg-slate-900 rounded border border-slate-700">
                                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-slate-700 text-slate-400"><Minus className="w-2 h-2" /></button>
                                      <span className="w-5 text-center text-[10px] font-mono text-white">{item.quantity}</span>
                                      <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-slate-700 text-slate-400"><Plus className="w-2 h-2" /></button>
                                  </div>
                                  <button onClick={() => removeFromCart(item.id)} className="ml-auto text-slate-500 hover:text-red-400 p-1">
                                      <Trash2 className="w-3 h-3" />
                                  </button>
                              </div>
                          </div>
                      </div>
                  ))
              )}
          </div>

          <div className="p-4 bg-slate-850 border-t border-slate-700 shrink-0">
              <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="text-slate-400">Wallet</span>
                  <span className="text-emerald-400 font-mono">${walletBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-300 font-bold text-sm">Total</span>
                  <span className="text-xl font-black text-white font-mono">${cartTotal.toFixed(2)}</span>
              </div>
              <button 
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || checkoutStatus !== 'IDLE'}
                  className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 text-xs ${
                      checkoutStatus === 'SUCCESS' ? 'bg-green-600 text-white' :
                      checkoutStatus === 'PROCESSING' ? 'bg-slate-700 text-slate-300 cursor-wait' :
                      'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
              >
                  {checkoutStatus === 'SUCCESS' ? <CheckCircle className="w-4 h-4" /> : 
                   checkoutStatus === 'PROCESSING' ? 'Processing...' : 
                   <>CHECKOUT <CreditCard className="w-4 h-4" /></>}
              </button>
          </div>
      </div>
  );

  return (
    <div className="h-full bg-slate-950 flex flex-col overflow-hidden relative">
        
        {/* HEADER */}
        <div className="bg-slate-900 border-b border-slate-700 flex flex-col md:flex-row justify-between items-center sm:items-start md:items-center min-h-16 h-auto px-4 py-2 shrink-0 z-20 gap-3">
            <div className="flex items-center gap-2 w-full md:w-auto">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shadow-lg transition-colors shrink-0 ${viewMode === 'STORE' ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' : 'bg-orange-600/20 text-orange-400 border-orange-500/30'}`}>
                    {viewMode === 'STORE' ? <Shield className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                    <h1 className="font-black text-base text-white tracking-tight truncate">{viewMode === 'STORE' ? 'COP SHOP' : 'LOGISTICS'}</h1>
                    <p className="text-[9px] text-slate-400 font-mono uppercase tracking-wider truncate">{viewMode === 'STORE' ? 'Tactical Supply & Gear' : 'Official Supply Management'}</p>
                </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                {/* View Toggle */}
                <div className="bg-slate-800 p-1 rounded-lg border border-slate-700 flex shrink-0">
                    <button 
                        onClick={() => setViewMode('STORE')}
                        className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${viewMode === 'STORE' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        Store
                    </button>
                    <button 
                        onClick={() => setViewMode('LOGISTICS')}
                        className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${viewMode === 'LOGISTICS' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        Supply
                    </button>
                </div>

                {viewMode === 'STORE' && (
                    <>
                        {/* Wallet Button */}
                        <button 
                            onClick={() => setShowWallet(true)}
                            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-3 py-2 transition-colors"
                        >
                            <Wallet className="w-4 h-4 text-green-400" />
                            <span className="text-sm font-mono font-bold text-white hidden md:block">${walletBalance.toFixed(2)}</span>
                        </button>

                        {/* Cart Button (Mobile Only - Desktop has persistent cart) */}
                        <button 
                            onClick={() => setShowCart(true)}
                            className="relative bg-blue-600 hover:bg-blue-500 text-white rounded-lg p-2 transition-colors md:hidden"
                        >
                            <ShoppingCart className="w-5 h-5" />
                            {cart.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-slate-900">
                                    {cart.length}
                                </span>
                            )}
                        </button>
                    </>
                )}
            </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex flex-1 overflow-hidden relative">
            
            {viewMode === 'STORE' ? (
                // --- STORE VIEW ---
                <>
                    {/* 1. LEFT SIDEBAR: Categories (Desktop) */}
                    <div className="hidden md:flex w-48 bg-slate-900 border-r border-slate-700 flex-col p-3 gap-2 overflow-y-auto">
                        <div className="text-xs font-bold text-slate-500 uppercase mb-2 px-2">Catalog</div>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`text-left px-3 py-2.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-between group ${
                                    activeCategory === cat 
                                    ? 'bg-blue-900/50 text-blue-400 border border-blue-500/50' 
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                }`}
                            >
                                <span className="truncate">{cat}</span>
                                {activeCategory === cat && <ChevronRight className="w-3 h-3" />}
                            </button>
                        ))}

                        <div className="mt-auto bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl p-3 border border-slate-700">
                            <Package className="w-6 h-6 text-blue-400 mb-2" />
                            <h3 className="text-xs font-bold text-white">Bulk Orders</h3>
                            <p className="text-[9px] text-slate-400 mt-1 leading-relaxed">
                                Contact HQ Logistics for volume procurement.
                            </p>
                        </div>
                    </div>

                    {/* 2. CENTER: Product Grid */}
                    <div className="flex-1 overflow-y-auto p-4 bg-grid-pattern">
                        {/* Search & Mobile Filter */}
                        <div className="mb-4 flex gap-2">
                             <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                                <input 
                                    type="text" 
                                    placeholder="Search tactical gear..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Mobile Categories Scroll */}
                        <div className="md:hidden flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                                        activeCategory === cat 
                                        ? 'bg-blue-600 text-white border-blue-500' 
                                        : 'bg-slate-800 text-slate-300 border-slate-700'
                                    }`}
                                >
                                    {cat}
                            </button>
                            ))}
                        </div>

                        {/* Product Grid - Adjusted for 1x2 inch tiles */}
                        <div className="flex flex-wrap gap-2 content-start justify-center md:justify-start">
                            {filteredProducts.map(product => (
                                <ProductCard key={product.id} product={product} onAdd={addToCart} />
                            ))}
                        </div>
                        
                        {filteredProducts.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                                <Search className="w-12 h-12 mb-4 opacity-20" />
                                <p>No products found in this category.</p>
                            </div>
                        )}
                    </div>

                    {/* 3. RIGHT SIDEBAR: Persistent Cart (Desktop) */}
                    <div className="hidden md:flex w-80 bg-slate-900 border-l border-slate-700 flex-col shrink-0">
                        <div className="p-4 border-b border-slate-700 bg-slate-850">
                            <h2 className="font-bold text-white text-sm flex items-center gap-2">
                                <ShoppingCart className="w-4 h-4 text-blue-500" /> Current Requisition
                            </h2>
                        </div>
                        <CartContent />
                    </div>
                </>
            ) : (
                // --- LOGISTICS VIEW ---
                <div className="flex-1 flex flex-col landscape:flex-row bg-slate-950 overflow-hidden">
                    
                    {/* LEFT PANEL: ASSETS (Fleet & Info) */}
                    <div className="w-full landscape:w-1/2 p-4 overflow-y-auto border-b landscape:border-b-0 landscape:border-r border-slate-800 space-y-4">
                        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 sticky top-0 bg-slate-950 z-10">Fleet Management</h2>
                        
                        {/* Fleet Card Container */}
                        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 relative overflow-hidden group">
                             <div className="aspect-[1.586/1] w-full max-w-sm mx-auto bg-gradient-to-br from-red-700 via-orange-600 to-amber-600 rounded-xl p-4 shadow-2xl relative overflow-hidden mb-4 transform transition-transform group-hover:scale-[1.02]">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
                                <div className="flex justify-between items-start relative z-10">
                                    <h3 className="font-black text-white text-lg italic tracking-widest">FLEET<span className="text-yellow-300">CARD</span></h3>
                                    <div className="bg-white/20 p-2 rounded text-white font-bold text-xs backdrop-blur-sm">PNP OFFICIAL</div>
                                </div>
                                <div className="flex gap-2 items-center relative z-10 my-4">
                                    <div className="w-12 h-8 bg-yellow-200 rounded-md opacity-80"></div>
                                    <div className="text-white/80 font-mono text-xs tracking-widest">{" >>>>>> "}</div>
                                </div>
                                <div className="relative z-10 mt-auto">
                                    <div className="text-white font-mono text-lg tracking-widest shadow-black drop-shadow-md">7092 1100 9921 4482</div>
                                    <div className="flex justify-between mt-2">
                                        <div className="text-[10px] text-white/70 uppercase">Unit: TPMO-S1</div>
                                        <div className="text-[10px] text-white/70 uppercase">Exp: 12/25</div>
                                    </div>
                                </div>
                             </div>

                             {/* Fuel Stats Grid */}
                             <div className="grid grid-cols-2 gap-3">
                                 <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                                     <div className="text-[10px] text-slate-500 uppercase font-bold">Fuel Balance</div>
                                     <div className="text-xl font-black text-white">142.5 L</div>
                                 </div>
                                 <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                                     <div className="text-[10px] text-slate-500 uppercase font-bold">Odometer</div>
                                     <div className="text-xl font-black text-white">45,210</div>
                                 </div>
                             </div>
                             
                             <button className="w-full mt-3 bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                                <QrCode className="w-4 h-4" /> SCAN FUEL QR
                             </button>
                        </div>

                        {/* Property Accountability (MR) */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
                             <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                                <h3 className="font-bold text-white text-xs flex items-center gap-2">
                                    <ClipboardList className="w-4 h-4 text-blue-400" /> Issued Items (MR)
                                </h3>
                                <button className="text-[10px] border border-slate-600 px-2 py-1 rounded text-slate-400 hover:text-white">Print</button>
                             </div>
                             <div className="max-h-48 overflow-y-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-950 text-slate-500 uppercase font-bold">
                                        <tr>
                                            <th className="p-3">Item Description</th>
                                            <th className="p-3">Serial No.</th>
                                            <th className="p-3 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800 text-slate-300">
                                        {MY_MRS.map(mr => (
                                            <tr key={mr.id} className="hover:bg-slate-800/50">
                                                <td className="p-3 font-bold">{mr.item}</td>
                                                <td className="p-3 font-mono text-slate-400">{mr.serial}</td>
                                                <td className="p-3 text-right">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${mr.status === 'ACTIVE' ? 'bg-green-900/30 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                                                        {mr.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                             </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: SUPPLY OPERATIONS */}
                    <div className="w-full landscape:w-1/2 p-4 overflow-y-auto bg-slate-950/50">
                        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 sticky top-0 bg-slate-950 z-10">Logistics Requests</h2>
                        
                        {/* Requisition Form */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-4 shadow-lg">
                             <div className="flex items-center gap-2 mb-4 text-orange-400 font-bold text-sm">
                                 <Boxes className="w-4 h-4" /> New Request
                             </div>
                             <div className="space-y-3">
                                 <div>
                                    <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Item Description</label>
                                    <input type="text" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white focus:border-orange-500 outline-none" placeholder="e.g. Bond Paper" value={reqItem} onChange={e => setReqItem(e.target.value)} />
                                 </div>
                                 <div className="flex gap-3">
                                     <div className="flex-1">
                                        <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Quantity</label>
                                        <input type="number" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white focus:border-orange-500 outline-none" placeholder="0" value={reqQty} onChange={e => setReqQty(e.target.value)} />
                                     </div>
                                     <div className="flex items-end">
                                         <button onClick={submitRequisition} className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-2 rounded font-bold text-xs h-[34px] shadow-lg active:scale-95 transition-all">SUBMIT</button>
                                     </div>
                                 </div>
                             </div>
                        </div>

                        {/* History */}
                        <div className="space-y-2">
                            <h3 className="text-[10px] text-slate-500 font-bold uppercase">Request History</h3>
                            {reqHistory.map(req => (
                                <div key={req.id} className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex justify-between items-center hover:border-slate-700 transition-colors">
                                    <div>
                                        <div className="text-xs font-bold text-white">{req.qty} {req.unit} - {req.item}</div>
                                        <div className="text-[10px] text-slate-500">{req.date} • {req.id}</div>
                                    </div>
                                    <span className={`text-[9px] px-2 py-1 rounded font-bold ${req.status === 'APPROVED' ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}`}>{req.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            )}

        </div>

        {/* --- MODALS / OVERLAYS --- */}

        {/* CART DRAWER (Mobile Only) */}
        {showCart && (
            <div className="absolute inset-0 z-50 flex justify-end md:hidden">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCart(false)} />
                <div className="relative w-full max-w-[320px] bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                    <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-850">
                        <h2 className="font-bold text-white flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-blue-500" /> Your Cart
                        </h2>
                        <button onClick={() => setShowCart(false)} className="text-slate-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <CartContent />
                </div>
            </div>
        )}

        {/* WALLET DRAWER (Keep existing for manual toggle if needed) */}
        {showWallet && (
            <div className="absolute inset-0 z-50 flex justify-end">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowWallet(false)} />
                <div className="relative w-full md:w-96 bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                    <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-850">
                        <h2 className="font-bold text-white flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-green-500" /> My E-Wallet
                        </h2>
                        <button onClick={() => setShowWallet(false)} className="text-slate-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 bg-slate-800 border-b border-slate-700 text-center">
                        <div className="text-sm text-slate-400 uppercase font-bold mb-1">Current Balance</div>
                        <div className="text-4xl font-black text-white font-mono mb-4">${walletBalance.toFixed(2)}</div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                            <History className="w-3 h-3" /> Recent Transactions
                        </h3>
                        {/* Transaction history omitted for brevity, reusing mock layout */}
                        <div className="text-center text-slate-500 text-xs py-10">No recent transactions.</div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default CopShopView;
