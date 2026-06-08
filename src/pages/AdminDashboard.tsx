import React, { useState, useEffect } from 'react';
import { GalleryModal } from '../components/EditableImage';
import { useAuth } from '../firebase/AuthContext';
import { 
  getProducts, 
  getCategories, 
  addProduct, 
  updateProduct, 
  deleteProduct,
  addCategory,
  updateCategory,
  deleteCategory,
  updateBranding,
  addGalleryImage,
  deleteGalleryImage,
  galleryRef,
  getFAQs,
  addFAQ,
  updateFAQ,
  deleteFAQ,
  getLocations,
  addLocation,
  updateLocation,
  deleteLocation,
  getVisits,
  getAllowedAdmins,
  addAllowedAdmin,
  deleteAllowedAdmin,
  getReviews,
  addReview,
  updateReview,
  deleteReview,
  reviewsRef,
  getOrders,
  updateOrder,
  deleteOrder,
  uploadAndOptimizeImage,
  getAtributos,
  addAtributo,
  updateAtributo,
  deleteAtributo,
  getPromotions,
  getShippingMethods,
  addShippingMethod,
  updateShippingMethod,
  deleteShippingMethod,
  getProductionStatus,
  updateProductionStatus,
  saveProductionBaseline
} from '../firebase/services';
import { Product, Category, BrandingSettings, GalleryImage, FAQ, Location, Review, Order, Atributo, OpcionAtributo, Promotion, ShippingMethod } from '../types';
import PromotionsManager from '../components/PromotionsManager';
import ShippingManager from '../components/ShippingManager';
import { PayPalSettingsSection } from '../components/PayPalSettingsSection';
import { 
  Plus, Trash2, Edit2, X, Save, LayoutDashboard, Package, Tags, LogOut, Palette, Upload, CheckCircle2, Menu, Image as ImageIcon, Loader2,
  Edit3, FileDown, MessageCircle, Share2, HelpCircle, Phone, Mail, Clock, Settings, FileText, Eye, ShieldCheck, Star, MapPin, Search, ShoppingBag, Facebook, Instagram, Linkedin, Youtube, Twitter,
  User, Truck, CreditCard, Sliders, Ticket, Smartphone
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ref, uploadBytes, getDownloadURL, deleteObject, ref as storageRef } from 'firebase/storage';
import { storage, db } from '../firebase/config';
import { useBranding } from '../firebase/BrandingContext';
import { useContent } from '../firebase/ContentContext';
import { onSnapshot, query, orderBy, doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { ConfirmModal } from '../components/ConfirmModal';
import ProductForm from '../components/ProductForm';
import { initAdminOrderNotifications, getNotificationPermissionState, requestPushPermission } from '../firebase/push';


export default function AdminDashboard() {
  const { user, profile, isAdmin, login, logout, loading: authLoading } = useAuth();
  const { content, setIsEditing } = useContent();
  const { branding } = useBranding();
  const navigate = useNavigate();
  const [isProductionActive, setIsProductionActive] = useState(false);

  useEffect(() => {
    const fetchProductionStatus = async () => {
      try {
        const status = await getProductionStatus();
        setIsProductionActive(status.isProduction);
      } catch (error) {
        console.error("Error fetching production status:", error);
      }
    };
    fetchProductionStatus();
  }, []);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'atributos' | 'categories' | 'branding' | 'pwa' | 'gallery' | 'reviews' | 'orders' | 'whatsapp' | 'social' | 'faqs' | 'contact' | 'legal' | 'admins' | 'promotions' | 'shipping' | 'paypal'>('dashboard');
  const [atributos, setAtributos] = useState<Atributo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [addingSubcategoryTo, setAddingSubcategoryTo] = useState<Category | null>(null);
  const [editingSpec, setEditingSpec] = useState<{ original: string; current: string } | null>(null);
  const [isSpecsModalOpen, setIsSpecsModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategoryForSpecs, setSelectedCategoryForSpecs] = useState<Category | null>(null);
  const [newSpecName, setNewSpecName] = useState('');
  const [visitCount, setVisitCount] = useState<number>(0);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const openConfirm = (title: string, message: string, onConfirm: () => void, variant: 'danger' | 'warning' | 'info' = 'danger') => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      variant
    });
  };

  const handleToggleProduction = () => {
    const nextStatus = !isProductionActive;
    if (nextStatus) {
      if (branding && content) {
        openConfirm(
          '¿Activar Modo Producción?',
          'La configuración de branding, colores, textos y imágenes actuales pasará a establecerse de manera fija como el estado preestablecido por defecto.',
          async () => {
            try {
              await saveProductionBaseline(branding, content);
              await updateProductionStatus(true);
              setIsProductionActive(true);
            } catch (e) {
              console.error("Error setting production mode:", e);
            }
          },
          'info'
        );
      } else {
        openConfirm(
          'Error',
          'La configuración de la página aún se está cargando. Inténtalo de nuevo en unos segundos.',
          () => {},
          'info'
        );
      }
    } else {
      openConfirm(
        '¿Desactivar Modo Producción?',
        'La configuración volverá a ser dinámica y totalmente editable por el panel de administración.',
        async () => {
          try {
            await updateProductionStatus(false);
            setIsProductionActive(false);
          } catch (e) {
            console.error("Error disabling production mode:", e);
          }
        },
        'warning'
      );
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
      const unsubscribeNotifications = initAdminOrderNotifications();
      return () => {
        if (typeof unsubscribeNotifications === 'function') {
          unsubscribeNotifications();
        }
      };
    }
  }, [isAdmin]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  const fetchData = async () => {
    const [p, c, v, f, l, r, o, a, pr, sm] = await Promise.all([
      getProducts(), 
      getCategories(), 
      getVisits(),
      getFAQs(),
      getLocations(),
      getReviews(),
      getOrders(),
      getAtributos(),
      getPromotions(),
      getShippingMethods()
    ]);
    setProducts(p);
    setCategories(c);
    setVisitCount(v);
    setFaqs(f);
    setLocations(l);
    setReviews(r);
    setOrders(o);
    setAtributos(a);
    setPromotions(pr);
    setShippingMethods(sm);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsAddingProduct(false);
  };

  const handleDeleteProduct = async (id: string) => {
    openConfirm(
      '¿Eliminar Producto?',
      'Esta acción no se puede deshacer. El producto desaparecerá del catálogo público.',
      async () => {
        await deleteProduct(id);
        fetchData();
      }
    );
  };

  const handleAddCategory = async () => {
    if (!newCategoryName) return;
    if (editingCategory) {
      await updateCategory(editingCategory.id, { 
        name: newCategoryName, 
        slug: newCategoryName.toLowerCase().replace(/\s+/g, '-') 
      });
      setEditingCategory(null);
    } else {
      const categoryData: any = { 
        name: newCategoryName, 
        slug: newCategoryName.toLowerCase().replace(/\s+/g, '-'),
      };
      if (addingSubcategoryTo) {
        categoryData.parentId = addingSubcategoryTo.id;
      }
      await addCategory(categoryData);
    }
    setNewCategoryName('');
    setAddingSubcategoryTo(null);
    fetchData();
  };

  const handleEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setNewCategoryName(cat.name);
  };

  const handleDeleteCategory = async (id: string) => {
    openConfirm(
      '¿Eliminar Categoría?',
      'Se eliminará la categoría. Asegúrate de que no haya productos vinculados a ella.',
      async () => {
        await deleteCategory(id);
        fetchData();
      }
    );
  };

  const handleAddSpec = async () => {
    if (!selectedCategoryForSpecs || !newSpecName) return;
    const currentSpecs = selectedCategoryForSpecs.specifications || [];
    
    let updatedSpecs: string[];
    if (editingSpec) {
      updatedSpecs = currentSpecs.map(s => s === editingSpec.original ? newSpecName : s);
      setEditingSpec(null);
    } else {
      if (currentSpecs.includes(newSpecName)) return;
      updatedSpecs = [...currentSpecs, newSpecName];
    }
    
    await updateCategory(selectedCategoryForSpecs.id, { specifications: updatedSpecs });
    setNewSpecName('');
    fetchData();
    setSelectedCategoryForSpecs({ ...selectedCategoryForSpecs, specifications: updatedSpecs });
  };

  const handleRemoveSpec = async (spec: string) => {
    if (!selectedCategoryForSpecs) return;
    const updatedSpecs = (selectedCategoryForSpecs.specifications || []).filter(s => s !== spec);
    await updateCategory(selectedCategoryForSpecs.id, { specifications: updatedSpecs });
    fetchData();
    setSelectedCategoryForSpecs({ ...selectedCategoryForSpecs, specifications: updatedSpecs });
  };

  if (authLoading) return <div className="h-screen flex items-center justify-center">Cargando...</div>;

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-12 rounded-3xl shadow-xl text-center max-w-md w-full border border-gray-100">
          <div className="bg-brand-orange/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <LayoutDashboard className="text-brand-orange" size={40} />
          </div>
          <h2 className="text-3xl font-black tracking-tighter mb-4">ACCESO RESTRINGIDO</h2>
          <p className="text-gray-500 mb-8">Debes iniciar sesión con una cuenta de administrador para acceder a este panel.</p>
          {!user ? (
            <button onClick={login} className="btn-primary w-full">Iniciar Sesión con Google</button>
          ) : (
            <div className="space-y-4">
              <p className="text-red-500 text-sm font-bold">Tu cuenta ({user.email}) no tiene permisos de administrador.</p>
              <button onClick={logout} className="btn-outline w-full">Cerrar Sesión</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden bg-brand-black text-white p-4 flex justify-between items-center sticky top-20 z-40 border-t border-white/10">
        <div className="flex items-center space-x-3">
          <div className="bg-brand-orange p-1.5 rounded-lg">
            <LayoutDashboard size={20} className="text-white" />
          </div>
          <span className="font-black tracking-tighter uppercase text-sm">Panel Admin</span>
        </div>
        <button 
          onClick={() => setIsMobileSidebarOpen(true)}
          className="flex items-center space-x-2 px-3 py-2 hover:bg-white/10 rounded-xl transition-colors"
        >
          <span className="text-xs font-bold uppercase tracking-wider">Ajustes</span>
          <Settings size={20} />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-brand-black/60 backdrop-blur-sm z-[70] lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-brand-black text-white z-[80] lg:hidden flex flex-col p-6 overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center space-x-3">
                  {user.photoURL && (
                    <img 
                      src={user.photoURL} 
                      alt="" 
                      className="w-10 h-10 rounded-full border-2 border-brand-orange" 
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div>
                    <p className="text-sm font-bold truncate max-w-[120px]">{user.displayName}</p>
                    <p className="text-[10px] text-brand-orange font-black uppercase tracking-widest">Admin</p>
                  </div>
                </div>
                <button onClick={() => setIsMobileSidebarOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                  <X size={20} />
                </button>
              </div>

              {/* Production Mode Toggle */}
              <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-[#93767e]">PRODUCCIÓN</span>
                    <p className="text-[9px] text-gray-400 mt-0.5">Establecer fijo</p>
                  </div>
                  <button
                    onClick={handleToggleProduction}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isProductionActive ? 'bg-brand-orange' : 'bg-gray-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isProductionActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <nav className="space-y-2 flex-grow">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                  { id: 'orders', label: 'Pedidos', icon: ShoppingBag },
                  { id: 'promotions', label: 'Promociones', icon: Ticket },
                  { id: 'shipping', label: 'Envíos', icon: Truck },
                  { id: 'products', label: 'Productos', icon: Package },
                  { id: 'atributos', label: 'Atributos', icon: Sliders },
                  { id: 'categories', label: 'Categorías', icon: Tags },
                  { id: 'branding', label: 'Branding', icon: Palette },
                  { id: 'pwa', label: 'PWA Config', icon: Smartphone },
                  { id: 'paypal', label: 'PayPal Settings', icon: CreditCard },
                  { id: 'gallery', label: 'Galería', icon: ImageIcon },
                  { id: 'reviews', label: 'Reseñas', icon: Star },
                  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
                  { id: 'social', label: 'Redes Sociales', icon: Share2 },
                  { id: 'faqs', label: 'Preguntas Frecuentes', icon: HelpCircle },
                  { id: 'contact', label: 'Contacto', icon: Phone },
                  { id: 'legal', label: 'Aviso Legal', icon: FileText },
                  { id: 'admins', label: 'Administradores', icon: ShieldCheck },
                ].map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id as any); setIsMobileSidebarOpen(false); }}
                      className={`w-full flex items-center justify-between px-4 py-4 rounded-xl transition-all uppercase relative ${
                        isActive ? 'bg-brand-orange text-white' : 'text-gray-400 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <item.icon size={20} />
                        <motion.span layout className="font-bold text-xs">{item.label}</motion.span>
                      </div>
                    </button>
                  );
                })}
              </nav>

              <button
                onClick={() => {
                  setIsEditing(true);
                  setIsMobileSidebarOpen(false);
                  navigate('/');
                }}
                className="w-full flex items-center space-x-3 px-4 py-4 rounded-xl transition-all text-brand-orange hover:bg-brand-orange/10 mb-2 uppercase"
              >
                <Edit3 size={20} />
                <span className="font-bold text-xs">Editar Web</span>
              </button>

              <button onClick={logout} className="flex items-center space-x-3 px-4 py-4 text-gray-400 hover:text-white transition-colors border-t border-white/10">
                <LogOut size={20} />
                <span className="font-bold text-xs">Cerrar Sesión</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="w-64 bg-brand-black text-white hidden lg:flex flex-col p-6 sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto">
        <div className="flex items-center space-x-3 mb-12 px-2">
          {user.photoURL && (
            <img 
              src={user.photoURL} 
              alt="" 
              className="w-10 h-10 rounded-full border-2 border-brand-orange" 
              referrerPolicy="no-referrer"
            />
          )}
          <div className="overflow-hidden">
            <p className="text-sm font-bold truncate">{user.displayName}</p>
            <p className="text-[10px] text-brand-orange font-black uppercase tracking-widest">Admin</p>
          </div>
        </div>

        {/* Production Mode Toggle */}
        <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-[#93767e]">PRODUCCIÓN</span>
              <p className="text-[9px] text-gray-400 mt-0.5">Establecer fijo</p>
            </div>
            <button
              onClick={handleToggleProduction}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isProductionActive ? 'bg-brand-orange' : 'bg-gray-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isProductionActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <nav className="space-y-2 flex-grow">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'orders', label: 'Pedidos', icon: ShoppingBag },
            { id: 'promotions', label: 'Promociones', icon: Ticket },
            { id: 'shipping', label: 'Envíos', icon: Truck },
            { id: 'products', label: 'Productos', icon: Package },
            { id: 'atributos', label: 'Atributos', icon: Sliders },
            { id: 'categories', label: 'Categorías', icon: Tags },
            { id: 'branding', label: 'Branding', icon: Palette },
            { id: 'pwa', label: 'PWA Config', icon: Smartphone },
            { id: 'paypal', label: 'PayPal Settings', icon: CreditCard },
            { id: 'gallery', label: 'Galería', icon: ImageIcon },
            { id: 'reviews', label: 'Reseñas', icon: Star },
            { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
            { id: 'social', label: 'Redes Sociales', icon: Share2 },
            { id: 'faqs', label: 'Preguntas Frecuentes', icon: HelpCircle },
            { id: 'contact', label: 'Contacto', icon: Phone },
            { id: 'legal', label: 'Aviso Legal', icon: FileText },
            { id: 'admins', label: 'Administradores', icon: ShieldCheck },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all uppercase relative ${
                  isActive ? 'bg-brand-orange text-white' : 'text-gray-400 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon size={20} />
                  <motion.span layout className="font-bold text-xs">{item.label}</motion.span>
                </div>
              </button>
            );
          })}
        </nav>

        <button
          onClick={() => {
            setIsEditing(true);
            navigate('/');
          }}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-brand-orange hover:bg-brand-orange/10 mb-2 uppercase"
        >
          <Edit3 size={20} />
          <span className="font-bold text-xs">Editar Web</span>
        </button>

        <button onClick={logout} className="flex items-center space-x-3 px-4 py-3 text-gray-400 hover:text-white transition-colors">
          <LogOut size={20} />
          <span className="font-bold text-xs">Cerrar Sesión</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-8 lg:p-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h1 className="text-4xl font-black tracking-tighter uppercase">
                {activeTab === 'dashboard' ? 'Dashboard' :
                 activeTab === 'orders' ? 'Gestión de Pedidos' :
                 activeTab === 'promotions' ? 'Gestión de Promociones' :
                 activeTab === 'shipping' ? 'Gestión de Envíos' :
                 activeTab === 'products' ? 'Gestión de Productos' : 
                 activeTab === 'atributos' ? 'Gestión de Atributos' :
                 activeTab === 'categories' ? 'Gestión de Categorías' : 
                 activeTab === 'branding' ? 'Identidad de Marca' : 
                 activeTab === 'pwa' ? 'Configuración PWA' : 
                 activeTab === 'paypal' ? 'Configuración de PayPal' :
                 activeTab === 'whatsapp' ? 'Configuración WhatsApp' :
                 activeTab === 'social' ? 'Redes Sociales' :
                 activeTab === 'faqs' ? 'Preguntas Frecuentes' :
                 activeTab === 'contact' ? 'Datos de Contacto' :
                 activeTab === 'legal' ? 'Aviso Legal' :
                 activeTab === 'admins' ? 'Administradores Permitidos' :
                 activeTab === 'reviews' ? 'Gestión de Reseñas' :
                  'Galería de Imágenes'}
              </h1>
              <p className="text-gray-500 text-sm">
                {activeTab === 'dashboard' ? 'Resumen general y métricas de rendimiento del sitio.' :
                 activeTab === 'orders' ? 'Administra y gestiona los pedidos realizados por tus clientes.' :
                 activeTab === 'promotions' ? 'Crea y administra códigos de descuento y cupones de compra.' :
                 activeTab === 'shipping' ? 'Configura proveedores de entregas, inventario de guías y reglas de envío gratis.' :
                 activeTab === 'atributos' ? 'Define y administra los ejes de personalización globales para tus productos.' :
                 activeTab === 'branding' ? 'Configura los logotipos y variantes visuales de la empresa.' : 
                 activeTab === 'pwa' ? 'Configura el nombre de la app, el color del tema, los iconos de la home-screen y el comportamiento PWA.' : 
                 activeTab === 'paypal' ? 'Establece y administra las credenciales y entornos para transacciones con PayPal.' :
                 activeTab === 'gallery' ? 'Sube y administra las imágenes para el catálogo y el sitio.' : 
                 activeTab === 'reviews' ? 'Administra las reseñas de tus clientes para mostrar en la web.' :
                 activeTab === 'whatsapp' ? 'Configura el número de WhatsApp principal para contacto.' :
                 activeTab === 'social' ? 'Vincula tus perfiles de redes sociales con el sitio web.' :
                 activeTab === 'faqs' ? 'Gestiona las preguntas frecuentes que aparecen en la web.' :
                 activeTab === 'contact' ? 'Administra los medios de contacto y ubicaciones físicas.' :
                 activeTab === 'legal' ? 'Configura los textos legales de privacidad y términos.' :
                 'Gestiona los correos de Gmail con acceso al panel de administración.'}
              </p>
            </div>
            {activeTab === 'products' && !editingProduct && !isAddingProduct && (
              <button
                onClick={() => { setEditingProduct(null); setIsAddingProduct(true); }}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>Nuevo Producto</span>
              </button>
            )}
          </div>

          {activeTab === 'dashboard' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center group hover:border-brand-orange transition-all">
                <div className="bg-brand-orange/10 p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                  <Eye className="text-brand-orange" size={32} />
                </div>
                <h3 className="text-3xl font-black tracking-tighter mb-1">{visitCount}</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Visitas Totales</p>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center group hover:border-brand-orange transition-all cursor-pointer" onClick={() => setActiveTab('orders')}>
                <div className="bg-brand-orange/10 p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                  <ShoppingBag className="text-brand-orange" size={32} />
                </div>
                <h3 className="text-3xl font-black tracking-tighter mb-1">{orders.length}</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pedidos</p>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center group hover:border-brand-orange transition-all cursor-pointer" onClick={() => setActiveTab('products')}>
                <div className="bg-brand-orange/10 p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                  <Package className="text-brand-orange" size={32} />
                </div>
                <h3 className="text-3xl font-black tracking-tighter mb-1">{products.length}</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Productos</p>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center group hover:border-brand-orange transition-all cursor-pointer" onClick={() => setActiveTab('categories')}>
                <div className="bg-brand-orange/10 p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                  <Tags className="text-brand-orange" size={32} />
                </div>
                <h3 className="text-3xl font-black tracking-tighter mb-1">{categories.length}</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Categorías</p>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center group hover:border-brand-orange transition-all">
                <div className="bg-brand-orange/10 p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                  <HelpCircle className="text-brand-orange" size={32} />
                </div>
                <h3 className="text-3xl font-black tracking-tighter mb-1">{faqs.length}</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Preguntas</p>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center group hover:border-brand-orange transition-all">
                <div className="bg-brand-orange/10 p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                  <Phone className="text-brand-orange" size={32} />
                </div>
                <h3 className="text-3xl font-black tracking-tighter mb-1">{locations.length}</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ubicaciones</p>
              </div>

              <div className="md:col-span-2 lg:col-span-3 bg-brand-black p-8 rounded-3xl shadow-sm border border-white/10 flex flex-col justify-center relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-2xl font-black text-white tracking-tighter mb-2 uppercase">Estado de la Web</h3>
                  <div className="flex items-center space-x-2 text-green-400">
                    <CheckCircle2 size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">En línea y funcionando</span>
                  </div>
                  <p className="text-gray-400 text-sm mt-4 max-w-md">
                    Tu sitio web está optimizado y recibiendo tráfico. Puedes gestionar todo el contenido desde este panel.
                  </p>
                </div>
                {branding?.isotypeLight && (
                  <img 
                    src={branding.isotypeLight} 
                    alt="" 
                    className="absolute -right-10 -bottom-10 w-48 h-48 object-contain opacity-10 rotate-12"
                  />
                )}
              </div>
            </div>
          ) : activeTab === 'atributos' ? (
            <AtributosSection 
              atributos={atributos}
              onSave={async (attr) => {
                await addAtributo(attr);
                fetchData();
              }}
              onEdit={async (id, attr) => {
                try {
                  await updateAtributo(id, attr);
                  fetchData();
                } catch (error: any) {
                  console.error("Error updating attribute:", error);
                  if (error.code === 'not-found' || error.message.includes('No document to update')) {
                    alert("El atributo que intentas editar ya no existe. El listado se actualizará.");
                  } else {
                    alert("Error al actualizar el atributo. Por favor intenta de nuevo.");
                  }
                  fetchData();
                }
              }}
              onDelete={async (id) => {
                openConfirm(
                  '¿Eliminar Atributo?',
                  'Se eliminará este eje de personalización de la base de datos global.',
                  async () => {
                    await deleteAtributo(id);
                    fetchData();
                  }
                );
              }}
            />
          ) : activeTab === 'products' ? (
            editingProduct || isAddingProduct ? (
              <ProductForm 
                product={editingProduct}
                globalAttributes={atributos}
                onSuccess={() => {
                  setEditingProduct(null);
                  setIsAddingProduct(false);
                  fetchData();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onCancel={() => {
                  setEditingProduct(null);
                  setIsAddingProduct(false);
                }}
              />
            ) : (
              <div className="space-y-6">
                <div className="relative max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, marca o modelo..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-brand-orange focus:border-transparent shadow-sm transition-all"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {products
                    .filter(p => 
                      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                      p.brand?.toLowerCase().includes(productSearch.toLowerCase()) ||
                      p.model?.toLowerCase().includes(productSearch.toLowerCase()) ||
                      p.category?.toLowerCase().includes(productSearch.toLowerCase())
                    )
                    .map((product) => (
                      <div key={product.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6">
                    <img src={product.images?.[0] || 'https://picsum.photos/seed/product/800/600'} alt="" className="w-24 h-24 rounded-xl object-cover bg-gray-50" referrerPolicy="no-referrer" />
                    <div className="flex-grow text-center md:text-left">
                      <h3 className="font-bold text-lg">{product.name}</h3>
                      <p className="text-sm text-gray-400 font-medium">{product.brand} {product.model} • {product.year}</p>
                      <span className="text-[10px] font-black uppercase tracking-widest text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded mt-2 inline-block">
                        {product.category}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => handleEdit(product)} className="p-3 text-gray-400 hover:text-brand-orange hover:bg-brand-orange/5 rounded-xl transition-all">
                        <Edit2 size={20} />
                      </button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 size={20} />
                      </button>
                    </div>
                      </div>
                    ))}
                </div>
              </div>
            )
          ) : activeTab === 'categories' ? (
            <div className="max-w-2xl">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-8">
                <h3 className="font-bold mb-4">
                  {editingCategory ? 'Editar Categoría' : addingSubcategoryTo ? `Añadir Subcategoría a ${addingSubcategoryTo.name}` : 'Añadir Nueva Categoría'}
                </h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="text"
                    placeholder="Ej: Excavadoras, Grúas..."
                    className="flex-grow px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-brand-orange"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={handleAddCategory} className="btn-primary flex-grow sm:flex-grow-0">
                      {editingCategory ? 'Guardar' : 'Añadir'}
                    </button>
                    {(editingCategory || addingSubcategoryTo) && (
                      <button 
                        onClick={() => {
                          setEditingCategory(null);
                          setAddingSubcategoryTo(null);
                          setNewCategoryName('');
                        }} 
                        className="btn-outline flex-grow sm:flex-grow-0"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                {categories.filter(c => !c.parentId).map((cat) => (
                  <div key={cat.id} className="space-y-2">
                    <div className="bg-white p-4 md:px-6 md:py-4 rounded-2xl border border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                      <div className="flex items-center space-x-4 min-w-0">
                        {cat.imageUrl ? (
                          <img src={cat.imageUrl} alt={cat.name} className="w-12 h-12 md:w-10 md:h-10 rounded-lg object-cover bg-gray-50 flex-shrink-0" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-12 h-12 md:w-10 md:h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-300 flex-shrink-0">
                            <ImageIcon size={20} />
                          </div>
                        )}
                        <span className="font-bold text-gray-900 truncate">{cat.name}</span>
                      </div>
                      <div className="flex items-center justify-end space-x-1 md:space-x-2">
                        <button 
                          onClick={() => {
                            setAddingSubcategoryTo(cat);
                            setNewCategoryName('');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="p-2 text-gray-400 hover:text-brand-orange hover:bg-brand-orange/5 rounded-lg transition-all flex-shrink-0" 
                          title="Añadir subcategoría"
                        >
                          <Plus size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            setEditingCategoryId(cat.id);
                            setIsGalleryModalOpen(true);
                          }}
                          className="p-2 text-gray-400 hover:text-brand-orange hover:bg-brand-orange/5 rounded-lg transition-all flex-shrink-0" 
                          title="Subir imagen"
                        >
                          <ImageIcon size={16} />
                        </button>
                        <button 
                          onClick={() => handleEditCategory(cat)}
                          className="p-2 text-gray-400 hover:text-brand-orange hover:bg-brand-orange/5 rounded-lg transition-all flex-shrink-0"
                          title="Editar nombre"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedCategoryForSpecs(cat);
                            setIsSpecsModalOpen(true);
                          }}
                          className="flex items-center space-x-1 px-3 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-brand-orange/10 hover:text-brand-orange transition-all text-[10px] md:text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                        >
                          <Settings size={14} />
                          <span className="hidden xs:inline">Especificaciones</span>
                          <span className="xs:hidden">Specs</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteCategory(cat.id)} 
                          className="text-gray-400 hover:text-red-500 p-2 flex-shrink-0"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Subcategories */}
                    <div className="ml-8 md:ml-12 space-y-2">
                      {categories.filter(sub => sub.parentId === cat.id).map((sub) => (
                        <div key={sub.id} className="bg-white/60 backdrop-blur-sm p-3 md:px-4 md:py-3 rounded-xl border border-dashed border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                          <div className="flex items-center space-x-3 min-w-0">
                            {sub.imageUrl ? (
                              <img src={sub.imageUrl} alt={sub.name} className="w-10 h-10 md:w-8 md:h-8 rounded-lg object-cover bg-gray-50 flex-shrink-0" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-10 h-10 md:w-8 md:h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-300 flex-shrink-0">
                                <ImageIcon size={14} />
                              </div>
                            )}
                            <span className="font-bold text-gray-700 text-sm truncate">{sub.name}</span>
                          </div>
                          <div className="flex items-center justify-end space-x-1">
                            <button 
                              onClick={() => {
                                setEditingCategoryId(sub.id);
                                setIsGalleryModalOpen(true);
                              }}
                              className="p-1.5 text-gray-400 hover:text-brand-orange hover:bg-brand-orange/5 rounded-lg transition-all flex-shrink-0" 
                              title="Subir imagen"
                            >
                              <ImageIcon size={14} />
                            </button>
                            <button 
                              onClick={() => handleEditCategory(sub)}
                              className="p-1.5 text-gray-400 hover:text-brand-orange hover:bg-brand-orange/5 rounded-lg transition-all flex-shrink-0"
                              title="Editar nombre"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedCategoryForSpecs(sub);
                                setIsSpecsModalOpen(true);
                              }}
                              className="flex items-center space-x-1 px-2 py-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-brand-orange/10 hover:text-brand-orange transition-all text-[9px] font-bold uppercase tracking-wider whitespace-nowrap"
                            >
                              <Settings size={12} />
                              <span>Specs</span>
                            </button>
                            <button 
                              onClick={() => handleDeleteCategory(sub.id)} 
                              className="text-gray-400 hover:text-red-500 p-1.5 flex-shrink-0"
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'orders' ? (
            <OrdersSection 
              orders={orders} 
              onStatusUpdate={async (id, status) => {
                await updateOrder(id, { status });
                fetchData();
              }}
              onDelete={async (id) => {
                openConfirm(
                  '¿Eliminar Pedido?',
                  'Esta acción eliminará el registro del pedido permanentemente.',
                  async () => {
                    await deleteOrder(id);
                    fetchData();
                  }
                );
              }}
            />
          ) : activeTab === 'branding' ? (
            <BrandingSection />
          ) : activeTab === 'pwa' ? (
            <PWASection />
          ) : activeTab === 'paypal' ? (
            <PayPalSettingsSection />
          ) : activeTab === 'whatsapp' ? (
            <WhatsAppSection />
          ) : activeTab === 'social' ? (
            <SocialMediaSection />
          ) : activeTab === 'faqs' ? (
            <FAQSection openConfirm={openConfirm} />
          ) : activeTab === 'contact' ? (
            <ContactSection openConfirm={openConfirm} />
          ) : activeTab === 'legal' ? (
            <LegalSection />
          ) : activeTab === 'reviews' ? (
            <ReviewsSection openConfirm={openConfirm} />
          ) : activeTab === 'promotions' ? (
            <PromotionsManager promotions={promotions} onRefresh={fetchData} />
          ) : activeTab === 'shipping' ? (
            <ShippingManager methods={shippingMethods} onRefresh={fetchData} />
          ) : activeTab === 'admins' ? (
            <AdminsSection />
          ) : (
            <GallerySection openConfirm={openConfirm} />
          )}
        </div>
      </main>

      <ConfirmModal 
        {...confirmModal}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      <GalleryModal 
        isOpen={isGalleryModalOpen}
        onClose={() => {
          setIsGalleryModalOpen(false);
          setEditingCategoryId(null);
        }}
        onSelect={(urls) => {
          if (editingCategoryId) {
            updateCategory(editingCategoryId, { imageUrl: urls[0] }).then(fetchData);
          }
        }}
      />

      {/* Category Specs Modal */}
      <AnimatePresence>
        {isSpecsModalOpen && selectedCategoryForSpecs && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSpecsModalOpen(false)}
              className="absolute inset-0 bg-brand-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black tracking-tighter uppercase">ESPECIFICACIONES</h2>
                  <p className="text-xs text-brand-orange font-bold uppercase tracking-widest">{selectedCategoryForSpecs.name}</p>
                </div>
                <button onClick={() => setIsSpecsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {editingSpec ? 'Editar Especificación' : 'Añadir Especificación'}
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ej: Motor, Tracción, Horas..."
                      className="flex-grow px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-brand-orange"
                      value={newSpecName}
                      onChange={(e) => setNewSpecName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSpec()}
                    />
                    <button onClick={handleAddSpec} className="btn-primary p-3">
                      {editingSpec ? <Save size={20} /> : <Plus size={20} />}
                    </button>
                    {editingSpec && (
                      <button 
                        onClick={() => {
                          setEditingSpec(null);
                          setNewSpecName('');
                        }} 
                        className="btn-outline p-3"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Especificaciones Actuales</h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {selectedCategoryForSpecs.specifications && selectedCategoryForSpecs.specifications.length > 0 ? (
                      selectedCategoryForSpecs.specifications.map((spec, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 group">
                          <span className="font-bold text-sm">{spec}</span>
                          <div className="flex items-center space-x-1">
                            <button 
                              onClick={() => {
                                setEditingSpec({ original: spec, current: spec });
                                setNewSpecName(spec);
                              }}
                              className="text-gray-400 hover:text-brand-orange opacity-0 group-hover:opacity-100 transition-all p-1"
                              title="Editar nombre"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => handleRemoveSpec(spec)}
                              className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400 italic py-4 text-center">No hay especificaciones personalizadas.</p>
                    )}
                  </div>
                </div>

                <div className="pt-4">
                  <button onClick={() => setIsSpecsModalOpen(false)} className="btn-primary w-full">Listo</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const GallerySection = ({ openConfirm }: { openConfirm: any }) => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previews, setPreviews] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const q = query(galleryRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const galleryData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryImage));
      setImages(galleryData);
    });
    return () => unsubscribe();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setToast({ message: `El archivo ${file.name} debe ser una imagen`, type: 'error' });
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        setToast({ message: `La imagen ${file.name} no debe exceder los 10MB`, type: 'error' });
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setSelectedFiles(validFiles);
    
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Process and upload images sequentially in a strict promise chain queue
      await selectedFiles.reduce(async (chain, file, idx) => {
        await chain;
        const currentProgress = (idx / selectedFiles.length) * 100;
        setUploadProgress(currentProgress + 10);

        const url = await uploadAndOptimizeImage(file, 'galeria');
        
        await addGalleryImage({
          url,
          name: file.name,
          size: file.size
        });

        setUploadProgress(((idx + 1) / selectedFiles.length) * 100);
      }, Promise.resolve());

      setToast({ message: `${selectedFiles.length} imágenes subidas con éxito`, type: 'success' });
      setSelectedFiles([]);
      setPreviews([]);
    } catch (error) {
      console.error("Error uploading images:", error);
      setToast({ message: 'Error al subir las imágenes', type: 'error' });
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const handleDelete = async (image: GalleryImage) => {
    openConfirm(
      '¿Eliminar Imagen?',
      'La imagen se eliminará permanentemente de la galería y del almacenamiento.',
      async () => {
        try {
          // Delete from Storage
          const sRef = storageRef(storage, image.url);
          await deleteObject(sRef).catch(err => console.warn("File might not exist in storage", err));
          
          // Delete from Firestore
          await deleteGalleryImage(image.id);
          setToast({ message: 'Imagen eliminada', type: 'success' });
        } catch (error) {
          console.error("Error deleting image:", error);
          setToast({ message: 'Error al eliminar la imagen', type: 'error' });
        }
      }
    );
  };

  return (
    <div className="space-y-12">
      {/* Upload Zone */}
      <div className="bg-white/40 backdrop-blur-xl p-8 rounded-[2rem] border border-white/20 shadow-2xl">
        <div className="max-w-xl mx-auto text-center">
          <h3 className="text-xl font-black tracking-tighter mb-6 uppercase">Subir a la Galería</h3>
          
          <div 
            className={`relative group border-2 border-dashed rounded-3xl p-12 transition-all cursor-pointer ${
              previews.length > 0 ? 'border-brand-orange bg-brand-orange/5' : 'border-gray-200 hover:border-brand-orange hover:bg-gray-50'
            }`}
            onClick={() => !uploading && document.getElementById('gallery-upload')?.click()}
          >
            <input 
              id="gallery-upload"
              type="file" 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileSelect}
              disabled={uploading}
              multiple
            />
            
            {previews.length > 0 ? (
              <div className="space-y-4">
                <div className="flex flex-wrap justify-center gap-2 max-h-48 overflow-y-auto p-2">
                  {previews.map((src, idx) => (
                    <img key={idx} src={src} alt="Preview" className="h-20 w-20 rounded-lg shadow-md object-cover" />
                  ))}
                </div>
                <p className="text-xs font-bold text-gray-400">{selectedFiles.length} imágenes seleccionadas</p>
                {!uploading && (
                  <div className="flex justify-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                      className="btn-primary py-2 px-6 text-sm"
                    >
                      Confirmar Subida
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedFiles([]); setPreviews([]); }}
                      className="btn-outline py-2 px-6 text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Upload className="text-gray-400 group-hover:text-brand-orange" size={32} />
                </div>
                <div>
                  <p className="font-bold text-gray-600">Arrastra o haz clic para subir</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG o WEBP (Máx. 10MB)</p>
                </div>
              </div>
            )}

            {uploading && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-3xl z-10">
                <Loader2 className="animate-spin text-brand-orange mb-4" size={48} />
                <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-brand-orange"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest mt-4 text-brand-orange">Procesando imagen...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {images.map((img) => (
          <motion.div 
            key={img.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative aspect-square bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all"
          >
            <img 
              src={img.url} 
              alt={img.name} 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-brand-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
              <p className="text-white text-[10px] font-bold truncate w-full mb-4">{img.name}</p>
              <button 
                onClick={() => handleDelete(img)}
                className="bg-red-500 text-white p-3 rounded-2xl hover:bg-red-600 transition-colors shadow-lg hidden md:flex"
              >
                <Trash2 size={20} />
              </button>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); handleDelete(img); }}
              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-xl md:hidden shadow-lg z-10"
            >
              <Trash2 size={16} />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 right-8 z-[200] px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 ${
              toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={20} /> : <X size={20} />}
            <span className="font-bold text-sm">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-4 hover:opacity-50"><X size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const OrdersSection = ({ orders, onStatusUpdate, onDelete }: { orders: Order[], onStatusUpdate: (id: string, status: Order['status']) => void, onDelete: (id: string) => void }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const translateStatus = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'PREPARANDO';
      case 'shipped': return 'EN CAMINO';
      case 'delivered': return 'ENTREGADO';
      case 'cancelled': return 'CANCELADO';
      default: return (status as string).toUpperCase();
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    }).format(price) + ' MXN';
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'shipped': return 'bg-blue-100 text-blue-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4">
        {orders.length === 0 ? (
          <div className="bg-white p-20 rounded-[3rem] text-center border border-dashed border-gray-200">
            <ShoppingBag size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No hay pedidos registrados aún</p>
          </div>
        ) : (
          orders.map((order) => (
            <motion.div 
              key={order.id}
              layout
              className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:border-brand-orange transition-all cursor-pointer group"
              onClick={() => setSelectedOrder(order)}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-gray-50 p-4 rounded-2xl group-hover:bg-brand-orange/5 transition-colors">
                    <ShoppingBag className="text-gray-400 group-hover:text-brand-orange" size={24} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-3 mb-1">
                      <h4 className="font-black text-lg">#{order.id.slice(-6).toUpperCase()}</h4>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                        {translateStatus(order.status)}
                      </span>
                    </div>
                    <p className="font-bold text-gray-900">{order.customerName}</p>
                    <p className="text-xs text-gray-400">{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'Recién creado'}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between md:justify-end gap-8">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</p>
                    <p className="font-black text-brand-orange text-xl">{formatPrice(order.totalPrice)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-brand-orange hover:bg-brand-orange/10 transition-all">
                      <Eye size={20} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(order.id); }}
                      className="p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-brand-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[3rem] p-10 max-w-4xl w-full relative z-10 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
            >
              <div className="flex justify-between items-start mb-10">
                <div>
                  <div className="flex items-center space-x-4 mb-2">
                    <h2 className="text-4xl font-black tracking-tighter uppercase">PEDIDO #{selectedOrder.id.slice(-6).toUpperCase()}</h2>
                    <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full ${getStatusColor(selectedOrder.status)}`}>
                      {translateStatus(selectedOrder.status)}
                    </span>
                  </div>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Realizado el {selectedOrder.createdAt?.toDate ? selectedOrder.createdAt.toDate().toLocaleString() : 'Recién'}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-3 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Details */}
                <div className="space-y-8">
                  <section className="space-y-4">
                    <div className="flex items-center space-x-3 text-brand-orange mb-2">
                      <User size={20} />
                      <h3 className="font-black uppercase tracking-tight">Información del Cliente</h3>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-3xl space-y-3">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nombre</p>
                        <p className="font-bold">{selectedOrder.customerName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email</p>
                        <p className="font-bold">{selectedOrder.email}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">WhatsApp</p>
                        <a href={`https://wa.me/${selectedOrder.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="font-bold text-brand-orange hover:underline flex items-center space-x-2">
                          <MessageCircle size={14} />
                          <span>{selectedOrder.whatsapp}</span>
                        </a>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-center space-x-3 text-brand-orange mb-1">
                      <Truck size={20} />
                      <h3 className="font-black uppercase tracking-tight">Dirección de Envío</h3>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-3xl space-y-3">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Calle y Número</p>
                        <p className="font-bold">{selectedOrder.address}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ciudad / Estado</p>
                          <p className="font-bold">{selectedOrder.city}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">CP</p>
                          <p className="font-bold">{selectedOrder.zip}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-center space-x-3 text-brand-orange mb-1">
                      <CreditCard size={20} />
                      <h3 className="font-black uppercase tracking-tight">Método de Pago</h3>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-3xl">
                      <div className="flex items-center justify-between">
                        {selectedOrder.paymentInfo?.method === 'paypal' ? (
                          <div>
                            <p className="text-[10px] font-black text-[#0070ba] uppercase tracking-widest leading-none">PayPal Checkout</p>
                            <p className="font-mono font-black text-xs text-gray-700 mt-1 uppercase tracking-wider">
                              Aprobado • Modo: {selectedOrder.paymentInfo?.mode || 'sandbox'}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Tarjeta</p>
                            <p className="font-mono font-bold mt-1">{selectedOrder.paymentInfo?.cardNumber || '**** **** **** ****'}</p>
                          </div>
                        )}
                        <CheckCircle2 className="text-green-500" size={24} />
                      </div>
                    </div>
                  </section>
                </div>

                {/* Items & Actions */}
                <div className="space-y-8">
                  <section className="space-y-4">
                    <div className="flex items-center space-x-3 text-brand-orange mb-1">
                      <Package size={20} />
                      <h3 className="font-black uppercase tracking-tight">Productos</h3>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-3xl space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                      {selectedOrder.items.map((item, idx) => (
                        <div key={`${item.id}-${idx}`} className="flex items-center space-x-4 border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                          <img src={item.imagen || item.images?.[0] || 'https://picsum.photos/seed/product/800/600'} alt="" className="w-16 h-16 rounded-xl object-cover bg-white" />
                          <div className="flex-grow">
                            <h4 className="font-bold text-sm leading-tight line-clamp-1">{item.name}</h4>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{item.quantity} un. x {formatPrice(item.price || 0)}</p>
                          </div>
                          <p className="font-black text-brand-orange">{formatPrice((item.price || 0) * item.quantity)}</p>
                        </div>
                      ))}
                      <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                        <span className="font-black uppercase tracking-tighter text-xl">Total</span>
                        <span className="text-2xl font-black tracking-tighter text-brand-orange">{formatPrice(selectedOrder.totalPrice)}</span>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-center space-x-3 text-brand-orange mb-1">
                      <Settings size={20} />
                      <h3 className="font-black uppercase tracking-tight">Gestión del Pedido</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {(['pending', 'shipped', 'delivered', 'cancelled'] as Order['status'][]).map((status) => (
                        <button
                          key={status}
                          onClick={() => {
                            onStatusUpdate(selectedOrder.id, status);
                            setSelectedOrder({ ...selectedOrder, status });
                          }}
                          className={`py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                            selectedOrder.status === status 
                              ? getStatusColor(status) + ' border-2 border-current ring-2 ring-current ring-offset-2'
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                        >
                          {translateStatus(status)}
                        </button>
                      ))}
                    </div>

                    {/* Número de Guía (Tracking Number) Section */}
                    <div className="bg-gray-50 p-6 rounded-3xl mt-4 space-y-3 border border-gray-100">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Número de Guía (Tracking Number)</label>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          placeholder="Ej: DHL123456789"
                          className="flex-grow bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-orange"
                          defaultValue={selectedOrder.trackingNumber || ''}
                          id={`order-tracking-${selectedOrder.id}`}
                        />
                        <button
                          onClick={async () => {
                            const input = document.getElementById(`order-tracking-${selectedOrder.id}`) as HTMLInputElement;
                            if (input) {
                              const trackingNumber = input.value.trim();
                              await updateOrder(selectedOrder.id, { trackingNumber });
                              setSelectedOrder({ ...selectedOrder, trackingNumber });
                              alert("Número de guía guardado en el pedido");
                            }
                          }}
                          className="px-5 py-2.5 bg-brand-orange text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-brand-orange/90 transition-all active:scale-95 shrink-0 shadow-lg shadow-brand-orange/10"
                        >
                          Guardar
                        </button>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AtributosSection = ({ atributos, onSave, onEdit, onDelete }: { 
  atributos: Atributo[], 
  onSave: (attr: Omit<Atributo, 'id'>) => Promise<void>,
  onEdit: (id: string, attr: Omit<Atributo, 'id'>) => Promise<void>,
  onDelete: (id: string) => Promise<void>
}) => {
  const [nombre, setNombre] = useState('');
  const [esVisual, setEsVisual] = useState(false);
  const [valoresTemporales, setValoresTemporales] = useState<OpcionAtributo[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // New option state
  const [nuevoValorNombre, setNuevoValorNombre] = useState('');
  const [tipoValor, setTipoValor] = useState<'texto' | 'color' | 'imagen'>('texto');
  const [valorExtra, setValorExtra] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleAddValor = () => {
    if (nuevoValorNombre.trim()) {
      const nuevaOpcion: OpcionAtributo = {
        id: Math.random().toString(36).substr(2, 9),
        nombre: nuevoValorNombre.trim(),
        tipoValor: esVisual ? tipoValor : 'texto',
        valorExtra: esVisual ? valorExtra : undefined
      };
      setValoresTemporales([...valoresTemporales, nuevaOpcion]);
      setNuevoValorNombre('');
      setValorExtra('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const fileRef = storageRef(storage, `attributes/${fileName}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      setValorExtra(url);
    } catch (error) {
      console.error("Error uploading attribute image:", error);
      alert("Error al subir la imagen");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveValor = (id: string) => {
    setValoresTemporales(valoresTemporales.filter(v => v.id !== id));
  };

  const handleSubmit = async () => {
    if (!nombre.trim() || valoresTemporales.length === 0) {
      alert('Nombre y al menos un valor son requeridos');
      return;
    }

    const data = { nombre, esVisual, valores: valoresTemporales };

    if (editingId) {
      await onEdit(editingId, data);
    } else {
      await onSave(data);
    }

    // Reset form
    setNombre('');
    setEsVisual(false);
    setValoresTemporales([]);
    setEditingId(null);
  };

  const startEdit = (attr: Atributo) => {
    setEditingId(attr.id);
    setNombre(attr.nombre);
    setEsVisual(attr.esVisual || false);
    setValoresTemporales(Array.isArray(attr.valores) ? attr.valores : []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* Form Section */}
      <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-gray-100 shadow-sm h-fit space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-black text-2xl tracking-tighter uppercase mb-1">
              {editingId ? 'Editar Atributo' : 'Crear Atributo'}
            </h3>
            <p className="text-gray-400 text-sm">Define ejes de personalización para tus productos.</p>
          </div>
          <div className="flex bg-gray-50 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => setEsVisual(false)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!esVisual ? 'bg-white shadow-sm text-brand-orange' : 'text-gray-400'}`}
            >
              Estándar
            </button>
            <button
              type="button"
              onClick={() => setEsVisual(true)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${esVisual ? 'bg-white shadow-sm text-brand-orange' : 'text-gray-400'}`}
            >
              Visual
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Nombre del Atributo</label>
            <input 
              type="text" 
              placeholder="Ej: Color, Material, Medidas" 
              className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-orange transition-all font-bold"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Añadir Nueva Opción</label>
            
            <div className="bg-gray-50 p-6 rounded-[2rem] space-y-4">
              <div className="space-y-2">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Nombre de la opción</p>
                <input 
                  type="text" 
                  placeholder="Nombre (ej: Nogal, Rojo, Grande)" 
                  className="w-full px-4 py-3 bg-white border-none rounded-xl focus:ring-2 focus:ring-brand-orange transition-all font-bold text-sm"
                  value={nuevoValorNombre}
                  onChange={(e) => setNuevoValorNombre(e.target.value)}
                />
              </div>

              {esVisual && (
                <div className="space-y-4 border-t border-gray-100 pt-4">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTipoValor('color')}
                      className={`flex-grow py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${tipoValor === 'color' ? 'bg-brand-black text-white border-brand-black' : 'bg-white text-gray-400 border-gray-100'}`}
                    >
                      <Palette size={14} />
                      Color
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoValor('imagen')}
                      className={`flex-grow py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${tipoValor === 'imagen' ? 'bg-brand-black text-white border-brand-black' : 'bg-white text-gray-400 border-gray-100'}`}
                    >
                      <ImageIcon size={14} />
                      Textura
                    </button>
                  </div>

                  {tipoValor === 'color' ? (
                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                        <input 
                          type="color" 
                          className="w-[120%] h-[120%] -translate-x-[10%] -translate-y-[10%] cursor-pointer"
                          value={valorExtra || '#000000'}
                          onChange={(e) => setValorExtra(e.target.value)}
                        />
                      </div>
                      <input 
                        type="text" 
                        value={valorExtra}
                        onChange={(e) => setValorExtra(e.target.value)}
                        placeholder="#HEX"
                        className="flex-grow bg-transparent border-none focus:ring-0 font-mono text-sm uppercase"
                      />
                    </div>
                  ) : (
                    <div className="relative group">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="bg-white border-2 border-dashed border-gray-100 rounded-xl p-4 text-center group-hover:border-brand-orange transition-all">
                        {isUploading ? (
                          <div className="flex flex-col items-center gap-2 py-2">
                            <Loader2 className="animate-spin text-brand-orange" size={20} />
                            <span className="text-[9px] font-black text-gray-400 uppercase">Subiendo...</span>
                          </div>
                        ) : valorExtra ? (
                          <div className="flex items-center gap-3">
                            <img src={valorExtra} className="w-10 h-10 rounded-lg object-cover border border-gray-100" />
                            <span className="text-[9px] font-black text-green-500 uppercase">¡Subido! Click para cambiar</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <Upload className="text-gray-300" size={20} />
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Subir textura</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button 
                type="button"
                onClick={handleAddValor}
                disabled={!nuevoValorNombre.trim() || (esVisual && !valorExtra)}
                className="w-full bg-brand-orange text-white py-3 rounded-xl hover:bg-brand-orange/80 transition-all shadow-md disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">Añadir a la lista</span>
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-2">Opciones Añadidas ({valoresTemporales.length})</p>
              <div className="flex flex-wrap gap-2 min-h-[4rem] p-4 bg-gray-50 border border-gray-100 rounded-2xl overflow-y-auto max-h-40">
                {valoresTemporales.length === 0 && (
                  <p className="text-gray-400 text-xs italic m-auto">Sin opciones añadidas aún</p>
                )}
                {valoresTemporales.map((val) => (
                  <span 
                    key={val.id} 
                    className="inline-flex items-center space-x-2 bg-white px-3 py-2 rounded-2xl border border-gray-100 shadow-sm transition-all hover:border-brand-orange"
                  >
                    {val.tipoValor === 'color' && (
                      <div className="w-4 h-4 rounded-full border border-black/5" style={{ backgroundColor: val.valorExtra }} />
                    )}
                    {val.tipoValor === 'imagen' && (
                      <img src={val.valorExtra} className="w-4 h-4 rounded-full object-cover border border-black/5" />
                    )}
                    <span className="text-[10px] font-black text-brand-black uppercase tracking-tight">{val.nombre}</span>
                    <button onClick={() => handleRemoveValor(val.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              onClick={handleSubmit}
              className="flex-grow btn-primary flex items-center justify-center space-x-2 py-5"
            >
              <Save size={20} />
              <span className="font-black uppercase tracking-widest text-sm">
                {editingId ? 'Actualizar Atributo' : 'Guardar Atributo'}
              </span>
            </button>
            {editingId && (
              <button 
                onClick={() => { setEditingId(null); setNombre(''); setValoresTemporales([]); setEsVisual(false); }}
                className="px-6 bg-gray-100 text-gray-500 rounded-3xl hover:bg-gray-200 font-bold uppercase text-[10px] tracking-widest transition-all"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* List Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-4">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Atributos Existentes</h3>
          <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full font-bold text-gray-400">
            {atributos.length} Total
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[800px] pr-2 custom-scrollbar">
          {atributos.length === 0 ? (
            <div className="bg-white p-12 rounded-[2.5rem] border border-dashed border-gray-200 text-center">
              <Sliders size={40} className="text-gray-100 mx-auto mb-4" />
              <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">No hay atributos definidos</p>
            </div>
          ) : (
            atributos.map((attr, idx) => (
              <motion.div 
                key={attr.id || `attr-${idx}`}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:border-brand-orange transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-black text-lg tracking-tighter uppercase">{attr.nombre}</h4>
                      {attr.esVisual && (
                        <span className="bg-brand-black text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded">Visual</span>
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {attr.valores.length} {attr.valores.length === 1 ? 'Opción' : 'Opciones'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => startEdit(attr)}
                      className="p-2 text-gray-400 hover:text-brand-orange hover:bg-brand-orange/5 rounded-xl transition-all"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => onDelete(attr.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(attr.valores || []).map((val, vIdx) => (
                    <div 
                      key={val.id || `${attr.id}-v-${vIdx}`} 
                      className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100"
                    >
                      {val.tipoValor === 'color' && (
                        <div className="w-3 h-3 rounded-full border border-black/5" style={{ backgroundColor: val.valorExtra }} />
                      )}
                      {val.tipoValor === 'imagen' && (
                        <img src={val.valorExtra} className="w-3 h-3 rounded-full object-cover border border-black/5" />
                      )}
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{val.nombre}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const PWASection = () => {
  const { user } = useAuth();
  const [pwaSettings, setPwaSettings] = useState<any>({
    name: "Averal Cosméticos México",
    shortName: "Averal",
    description: "Productos 100% naturales y orgánicos para el cuidado de tu piel y cabello. Porque la mejor cosmética nace de la naturaleza.",
    themeColor: "#1d2425",
    backgroundColor: "#e9eaec",
    displayMode: "standalone",
    orientation: "portrait",
    icon192: "",
    icon512: "",
    fcmServerKey: ""
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [editingField, setEditingField] = useState<'icon192' | 'icon512' | null>(null);
  
  const [permissionState, setPermissionState] = useState<string>('unknown');
  const [testNotificationStatus, setTestNotificationStatus] = useState<string>('');

  useEffect(() => {
    const docRef = doc(db, 'settings', 'pwa');
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setPwaSettings((prev: any) => ({
          ...prev,
          ...data
        }));
      }
      setIsLoading(false);
    });

    // Check device notification permission
    getNotificationPermissionState().then(state => {
      setPermissionState(state);
    });

    return () => unsub();
  }, []);

  const handleRequestPermission = async () => {
    const email = user?.email || 'admin@averal.mx';
    const success = await requestPushPermission(email);
    if (success) {
      setPermissionState('granted');
    } else {
      const updatedState = await getNotificationPermissionState();
      setPermissionState(updatedState);
    }
  };

  const handleTestNotification = async () => {
    setTestNotificationStatus('Enviando...');
    try {
      const response = await fetch('/api/send-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '🔔 Notificación de Prueba',
          body: 'Las notificaciones push de Averal están configuradas correctamente.',
          url: '/admin'
        })
      });
      const data = await response.json();
      if (data.success) {
        setTestNotificationStatus('¡Enviada con éxito!');
      } else {
        setTestNotificationStatus('Error: ' + (data.message || 'Error en envío'));
      }
    } catch (err: any) {
      setTestNotificationStatus('Error: ' + err.message);
    }
    setTimeout(() => setTestNotificationStatus(''), 5000);
  };

  const handleSaveField = async (field: string, value: any) => {
    setIsSaving(true);
    try {
      const docRef = doc(db, 'settings', 'pwa');
      await setDoc(docRef, { [field]: value }, { merge: true });
    } catch (e) {
      console.error("Error updating PWA field:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectIcon = async (url: string) => {
    if (!editingField) return;
    setIsSaving(true);
    try {
      const docRef = doc(db, 'settings', 'pwa');
      await setDoc(docRef, { [editingField]: url }, { merge: true });
    } catch (e) {
      console.error("Error updating PWA icon:", e);
    } finally {
      setIsSaving(false);
      setIsSelectorOpen(false);
      setEditingField(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="animate-spin text-brand-orange" size={40} />
      </div>
    );
  }

  const defaultIcon = 'https://firebasestorage.googleapis.com/v0/b/cosmeticos-storeonline.firebasestorage.app/o/galeria%2F1780596645793_1_7._Si_mbolo_Oficial.webp?alt=media&token=af4e2dc4-b078-4890-9592-853367e92d81';

  return (
    <div className="space-y-8">
      {/* PWA Settings Form */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
        <div>
          <h3 className="font-black text-xl tracking-tighter uppercase mb-1">Configuración del Manifiesto</h3>
          <p className="text-gray-400 text-sm">Define cómo se presentará la aplicación al instalarse en teléfonos o computadoras de tus clientes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 col-gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Nombre de la Aplicación</label>
            <input 
              type="text"
              value={pwaSettings.name}
              onChange={(e) => setPwaSettings({...pwaSettings, name: e.target.value})}
              onBlur={(e) => handleSaveField('name', e.target.value)}
              className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange font-bold text-sm transition-all text-brand-black"
              placeholder="e.g. Averal Cosméticos México"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Nombre Corto de la Aplicación (Homescreen)</label>
            <input 
              type="text"
              value={pwaSettings.shortName || ''}
              onChange={(e) => setPwaSettings({...pwaSettings, shortName: e.target.value})}
              onBlur={(e) => handleSaveField('shortName', e.target.value)}
              className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange font-bold text-sm transition-all text-brand-black"
              placeholder="e.g. Averal"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Descripción de la App</label>
            <textarea 
              value={pwaSettings.description || ''}
              onChange={(e) => setPwaSettings({...pwaSettings, description: e.target.value})}
              onBlur={(e) => handleSaveField('description', e.target.value)}
              rows={3}
              className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange font-bold text-sm transition-all text-brand-black resize-none"
              placeholder="Escribe una breve descripción del propósito de la aplicación..."
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 block">Color del Tema (Theme Color)</label>
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-brand-orange transition-all">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-inner border border-gray-200">
                <input 
                  type="color" 
                  value={pwaSettings.themeColor || '#1d2425'} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setPwaSettings({...pwaSettings, themeColor: val});
                    handleSaveField('themeColor', val);
                  }}
                  className="absolute inset-x-0 -inset-y-4 w-full h-[150%] cursor-pointer border-none bg-transparent"
                />
              </div>
              <div className="flex-grow">
                <input 
                  type="text" 
                  value={pwaSettings.themeColor || '#1d2425'} 
                  onChange={(e) => setPwaSettings({...pwaSettings, themeColor: e.target.value})}
                  onBlur={(e) => handleSaveField('themeColor', e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 font-mono text-sm font-bold uppercase p-0"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 block">Color de Fondo (Splash Screen)</label>
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-brand-orange transition-all">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-inner border border-gray-200">
                <input 
                  type="color" 
                  value={pwaSettings.backgroundColor || '#e9eaec'} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setPwaSettings({...pwaSettings, backgroundColor: val});
                    handleSaveField('backgroundColor', val);
                  }}
                  className="absolute inset-x-0 -inset-y-4 w-full h-[150%] cursor-pointer border-none bg-transparent"
                />
              </div>
              <div className="flex-grow">
                <input 
                  type="text" 
                  value={pwaSettings.backgroundColor || '#e9eaec'} 
                  onChange={(e) => setPwaSettings({...pwaSettings, backgroundColor: e.target.value})}
                  onBlur={(e) => handleSaveField('backgroundColor', e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 font-mono text-sm font-bold uppercase p-0"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Modo de Visualización (Display)</label>
            <select
              value={pwaSettings.displayMode || 'standalone'}
              onChange={(e) => {
                setPwaSettings({...pwaSettings, displayMode: e.target.value});
                handleSaveField('displayMode', e.target.value);
              }}
              className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange font-bold text-sm transition-all text-brand-black"
            >
              <option value="standalone">Standalone (Recomendado - Parece App nativa)</option>
              <option value="fullscreen">Fullscreen (Pantalla completa sin barra de estado)</option>
              <option value="minimal-ui">Minimal UI (Barra de navegación minimalista)</option>
              <option value="browser">Browser (Navegador normal)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Orientación Forzada</label>
            <select
              value={pwaSettings.orientation || 'portrait'}
              onChange={(e) => {
                setPwaSettings({...pwaSettings, orientation: e.target.value});
                handleSaveField('orientation', e.target.value);
              }}
              className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange font-bold text-sm transition-all text-brand-black"
            >
              <option value="any">Cualquiera (Multidireccional)</option>
              <option value="portrait">Vertical fija (Recomendado - Portrait)</option>
              <option value="landscape">Horizontal fija (Landscape)</option>
            </select>
          </div>
        </div>
      </div>

      {/* PWA Icon Management */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Icon 192x192 */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-lg mb-1">Icono de Pantalla de Inicio (192x192)</h3>
          <p className="text-gray-400 text-sm mb-6">Icono oficial que se colocará en la pantalla de inicio del teléfono.</p>
          
          <div className="aspect-square w-32 h-32 mx-auto rounded-2xl mb-6 flex items-center justify-center border-2 border-dashed border-gray-200 relative overflow-hidden bg-gray-50">
            <img 
              src={pwaSettings.icon192 || defaultIcon} 
              alt="Icono PWA 192" 
              className="w-full h-full object-contain p-2" 
              referrerPolicy="no-referrer"
            />
          </div>

          <button 
            onClick={() => {
              setEditingField('icon192');
              setIsSelectorOpen(true);
            }}
            className="btn-outline w-full flex items-center justify-center space-x-2 animate-all"
          >
            <ImageIcon size={18} />
            <span>{pwaSettings.icon192 ? 'Cambiar Icono 192px' : 'Subir Icono 192px'}</span>
          </button>
        </div>

        {/* Icon 512x512 */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-lg mb-1">Icono de Splash (512x512)</h3>
          <p className="text-gray-400 text-sm mb-6">Utilizado para la pantalla de carga inicial o de presentación de tu PWA.</p>
          
          <div className="aspect-square w-32 h-32 mx-auto rounded-2xl mb-6 flex items-center justify-center border-2 border-dashed border-gray-200 relative overflow-hidden bg-gray-50">
            <img 
              src={pwaSettings.icon512 || defaultIcon} 
              alt="Icono PWA 512" 
              className="w-full h-full object-contain p-2" 
              referrerPolicy="no-referrer"
            />
          </div>

          <button 
            onClick={() => {
              setEditingField('icon512');
              setIsSelectorOpen(true);
            }}
            className="btn-outline w-full flex items-center justify-center space-x-2 animate-all"
          >
            <ImageIcon size={18} />
            <span>{pwaSettings.icon512 ? 'Cambiar Icono 512px' : 'Subir Icono 512px'}</span>
          </button>
        </div>
      </div>

      {/* Configuración de Notificaciones Push */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
        <div>
          <h3 className="font-black text-xl tracking-tighter uppercase mb-1">Notificaciones Push de Pedidos</h3>
          <p className="text-gray-400 text-sm">Recibe alertas en este celular o computadora al instante de que se realice un nuevo pedido.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Col 1: Estado del Dispositivo Local */}
          <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${permissionState === 'granted' ? 'bg-green-500 animate-pulse' : 'bg-brand-orange'}`} />
                <h4 className="font-bold text-base text-brand-black">Estado del Dispositivo</h4>
              </div>

              <div className="text-sm space-y-1">
                {permissionState === 'granted' ? (
                  <p className="text-gray-500 font-medium">
                    ¡Vinculado con éxito! Este dispositivo recibirá alertas de nuevos pedidos de inmediato.
                  </p>
                ) : permissionState === 'denied' ? (
                  <p className="text-brand-orange font-bold">
                    Mensajes bloqueados. Por favor habilita permisos de notificaciones para este sitio web en el celular o PC.
                  </p>
                ) : (
                  <p className="text-gray-400 font-medium">
                    Aún no has activado notificaciones. Presiona el botón de abajo para sincronizar.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap gap-3">
              {permissionState !== 'granted' ? (
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  className="px-5 py-3 bg-brand-black text-white hover:bg-brand-orange font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Sincronizar Dispositivo
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleTestNotification}
                  disabled={!!testNotificationStatus && testNotificationStatus.includes('Enviando')}
                  className="px-5 py-3 btn-outline text-brand-black font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  {testNotificationStatus || "Enviar Alerta de Prueba 🔔"}
                </button>
              )}
            </div>
          </div>

          {/* Col 2: Credencial de Servidor (FCM Key) */}
          <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 block">
              FCM Server Key (Clave del Servidor Legacy)
            </label>
            <input
              type="password"
              value={pwaSettings.fcmServerKey || ''}
              onChange={(e) => setPwaSettings({...pwaSettings, fcmServerKey: e.target.value})}
              onBlur={(e) => handleSaveField('fcmServerKey', e.target.value)}
              className="w-full px-5 py-4 bg-white rounded-2xl border border-gray-100 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange font-bold text-sm transition-all text-brand-black"
              placeholder="AIzaSy..."
            />
            <p className="text-gray-400 text-xs leading-relaxed">
              La FCM Server Key vincula Firebase con tu backend. Esto habilita las notificaciones en segundo plano para Capacitor y dispositivos IOS y Android en modo PWA.
            </p>
          </div>
        </div>
      </div>

      <GalleryModal 
        isOpen={isSelectorOpen}
        onClose={() => {
          setIsSelectorOpen(false);
          setEditingField(null);
        }}
        onSelect={(urls) => handleSelectIcon(urls[0])}
      />
    </div>
  );
};

const BrandingSection = () => {
  const { branding } = useBranding();
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [editingType, setEditingType] = useState<keyof BrandingSettings | null>(null);

  const handleSelect = async (url: string) => {
    if (!editingType) return;
    try {
      await updateBranding({ [editingType]: url });
    } catch (error) {
      console.error("Error updating branding image:", error);
    }
  };

  const handleColorChange = async (colorKey: string, value: string) => {
    try {
      await updateBranding({
        colors: {
          primary: branding?.colors?.primary || '#ea9900',
          secondary: branding?.colors?.secondary || '#000000',
          background: branding?.colors?.background || '#ffffff',
          text: branding?.colors?.text || '#000000',
          ...branding?.colors,
          [colorKey]: value
        }
      } as any);
    } catch (error) {
      console.error("Error updating branding colors:", error);
    }
  };

  const resetColors = async () => {
    try {
      await updateBranding({
        colors: {
          primary: '#ea9900',
          secondary: '#000000',
          background: '#ffffff',
          text: '#000000'
        }
      } as any);
    } catch (error) {
      console.error("Error resetting branding colors:", error);
    }
  };

  const brandingItems = [
    { id: 'logoDark', label: 'Logotipo (Dark)', desc: 'Para fondos claros' },
    { id: 'logoLight', label: 'Logotipo (Light)', desc: 'Para fondos oscuros' },
    { id: 'isotypeDark', label: 'Isotipo (Dark)', desc: 'Para fondos claros' },
    { id: 'isotypeLight', label: 'Isotipo (Light)', desc: 'Para fondos oscuros' },
  ];

  const togglePreloader = async () => {
    try {
      await updateBranding({ showPreloader: !branding?.showPreloader });
    } catch (error) {
      console.error("Error updating preloader setting:", error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Color Palette Section */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-black text-xl tracking-tighter uppercase">Paleta de Colores</h3>
            <p className="text-gray-400 text-sm">Personaliza la identidad visual global de tu tienda.</p>
          </div>
          <button 
            onClick={resetColors}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100 transition-all text-xs font-bold uppercase tracking-widest border border-gray-100"
          >
            <Settings size={14} />
            <span>Restablecer</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { id: 'primary', label: 'Primario', default: '#ea9900' },
            { id: 'secondary', label: 'Secundario', default: '#000000' },
            { id: 'background', label: 'Fondo', default: '#ffffff' },
            { id: 'text', label: 'Texto', default: '#000000' },
          ].map((color) => (
            <div key={color.id} className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">{color.label}</label>
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-brand-orange transition-all">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-inner border border-gray-200">
                  <input 
                    type="color" 
                    value={branding?.colors?.[color.id as keyof NonNullable<BrandingSettings['colors']>] || color.default} 
                    onChange={(e) => handleColorChange(color.id, e.target.value)}
                    className="absolute inset-x-0 -inset-y-4 w-full h-[150%] cursor-pointer border-none bg-transparent"
                  />
                </div>
                <div className="flex-grow">
                  <input 
                    type="text" 
                    value={branding?.colors?.[color.id as keyof NonNullable<BrandingSettings['colors']>] || color.default} 
                    onChange={(e) => handleColorChange(color.id, e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-0 font-mono text-sm font-bold uppercase p-0"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preloader Toggle */}
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg">Preloader de Inicio</h3>
          <p className="text-gray-400 text-sm">Muestra una pantalla de carga profesional al entrar al sitio.</p>
        </div>
        <button 
          onClick={togglePreloader}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            branding?.showPreloader !== false ? 'bg-brand-orange' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              branding?.showPreloader !== false ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {brandingItems.map((item) => (
        <div key={item.id} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-lg mb-1">{item.label}</h3>
          <p className="text-gray-400 text-sm mb-6">{item.desc}</p>
          
          <div className={`aspect-video rounded-2xl mb-6 flex items-center justify-center border-2 border-dashed border-gray-100 relative overflow-hidden ${item.id.includes('Light') ? 'bg-brand-black' : 'bg-gray-50'}`}>
            {branding?.[item.id as keyof BrandingSettings] ? (
              <img 
                src={branding[item.id as keyof BrandingSettings]} 
                alt="" 
                className="max-h-20 object-contain" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <Palette className="text-gray-200" size={48} />
            )}
          </div>

          <button 
            onClick={() => {
              setEditingType(item.id as keyof BrandingSettings);
              setIsSelectorOpen(true);
            }}
            className="btn-outline w-full flex items-center justify-center space-x-2"
          >
            <ImageIcon size={18} />
            <span>{branding?.[item.id as keyof BrandingSettings] ? 'Cambiar Imagen' : 'Subir Imagen'}</span>
          </button>
        </div>
      ))}
      </div>

      <GalleryModal 
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        onSelect={(urls) => handleSelect(urls[0])}
      />
    </div>
  );
};

const WhatsAppSection = () => {
  const { branding } = useBranding();

  return (
    <div className="max-w-2xl space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center space-x-4 mb-2">
          <div className="bg-[#25D366]/10 p-3 rounded-2xl text-[#25D366]">
            <MessageCircle size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg">Configuración de WhatsApp</h3>
            <p className="text-sm text-gray-400">Este número se usará para la burbuja de chat y botones de contacto.</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Número de WhatsApp (con código de país)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">+</span>
            <input 
              type="text" 
              placeholder="525569143901"
              defaultValue={branding?.whatsapp}
              onBlur={(e) => updateBranding({ whatsapp: e.target.value.replace(/\+/g, '') })}
              className="w-full pl-8 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-brand-orange font-mono" 
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-2 italic">Ejemplo: 525569143901 (Sin espacios ni guiones)</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Mensaje Predeterminado</label>
          <textarea 
            rows={4}
            placeholder="Hola, necesito más información sobre los productos..."
            defaultValue={branding?.whatsappMessage}
            onBlur={(e) => updateBranding({ whatsappMessage: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-brand-orange text-sm leading-relaxed" 
          />
          <p className="text-[10px] text-gray-400 mt-1">Este mensaje aparecerá automáticamente cuando el cliente haga clic en el botón de WhatsApp.</p>
        </div>
      </div>
    </div>
  );
};

const SocialMediaSection = () => {
  const { branding } = useBranding();

  const updateSocial = (network: string, value: string) => {
    updateBranding({
      socialLinks: {
        ...branding?.socialLinks,
        [network]: value
      }
    });
  };

  const networks = [
    { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-600', bg: 'bg-pink-50' },
    { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-700', bg: 'bg-blue-50' },
    { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-600', bg: 'bg-red-50' },
    { id: 'twitter', label: 'Twitter / X', icon: Twitter, color: 'text-gray-900', bg: 'bg-gray-50' },
    { id: 'mercadopago', label: 'Mercado Pago / Libre', icon: ShoppingBag, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  ];

  return (
    <div className="max-w-2xl space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8">
        <h3 className="font-bold text-lg">Redes Sociales</h3>
        
        <div className="space-y-6">
          {networks.map((net) => (
            <div key={net.id} className="space-y-2">
              <div className="flex items-center space-x-3 mb-1">
                <div className={`${net.bg} ${net.color} p-2 rounded-lg`}>
                  <net.icon size={18} />
                </div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{net.label}</label>
              </div>
              <input 
                type="url" 
                placeholder={`https://${net.id}.com/tu-perfil`}
                defaultValue={(branding?.socialLinks as any)?.[net.id]}
                onBlur={(e) => updateSocial(net.id, e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-brand-orange" 
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ContactSection = ({ openConfirm }: { openConfirm: any }) => {
  const { branding } = useBranding();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, reset, setValue } = useForm<Omit<Location, 'id'>>();

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const data = await getLocations();
      setLocations(data);
    } catch (error) {
      console.error("Error fetching locations:", error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: Omit<Location, 'id'>) => {
    try {
      if (editingLocation) {
        await updateLocation(editingLocation.id, data);
      } else {
        await addLocation({ ...data, order: locations.length });
      }
      setIsModalOpen(false);
      setEditingLocation(null);
      reset();
      fetchLocations();
    } catch (error) {
      console.error("Error saving location:", error);
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setValue('title', location.title);
    setValue('address', location.address);
    setValue('hours', location.hours || '');
    setValue('googleMapsUrl', location.googleMapsUrl || '');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    openConfirm(
      '¿Eliminar Ubicación?',
      'Esta ubicación dejará de mostrarse en la página de contacto.',
      async () => {
        await deleteLocation(id);
        fetchLocations();
      }
    );
  };

  const updateContactInfo = async (field: string, value: string) => {
    try {
      await updateBranding({ [field]: value });
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
    }
  };

  const addPhone = async () => {
    const currentPhones = branding?.phones || (branding?.phone ? [branding.phone] : []);
    await updateBranding({ phones: [...currentPhones, ''] });
  };

  const removePhone = async (index: number) => {
    const currentPhones = branding?.phones || (branding?.phone ? [branding.phone] : []);
    const updatedPhones = currentPhones.filter((_, i) => i !== index);
    await updateBranding({ phones: updatedPhones });
  };

  const updatePhone = async (index: number, value: string) => {
    const currentPhones = branding?.phones || (branding?.phone ? [branding.phone] : []);
    const updatedPhones = [...currentPhones];
    updatedPhones[index] = value;
    await updateBranding({ phones: updatedPhones });
  };

  const addEmail = async () => {
    const currentEmails = branding?.emails || (branding?.email ? [branding.email] : []);
    await updateBranding({ emails: [...currentEmails, ''] });
  };

  const removeEmail = async (index: number) => {
    const currentEmails = branding?.emails || (branding?.email ? [branding.email] : []);
    const updatedEmails = currentEmails.filter((_, i) => i !== index);
    await updateBranding({ emails: updatedEmails });
  };

  const updateEmail = async (index: number, value: string) => {
    const currentEmails = branding?.emails || (branding?.email ? [branding.email] : []);
    const updatedEmails = [...currentEmails];
    updatedEmails[index] = value;
    await updateBranding({ emails: updatedEmails });
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="space-y-12">
      {/* Phone & Email Config */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className="bg-brand-orange/10 text-brand-orange p-2 rounded-lg">
                <Phone size={18} />
              </div>
              <h3 className="font-bold text-lg">Teléfonos de Contacto</h3>
            </div>
            <button 
              onClick={addPhone}
              className="p-2 text-brand-orange hover:bg-brand-orange/10 rounded-lg transition-all"
              title="Añadir teléfono"
            >
              <Plus size={20} />
            </button>
          </div>
          
          <div className="space-y-4">
            {(branding?.phones || (branding?.phone ? [branding.phone] : [''])).map((phone, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-grow space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Número {index + 1}</label>
                  <input 
                    type="tel" 
                    defaultValue={phone}
                    onBlur={(e) => updatePhone(index, e.target.value)}
                    placeholder="+52 55 6914 3901"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-brand-orange" 
                  />
                </div>
                {index > 0 && (
                  <button 
                    onClick={() => removePhone(index)}
                    className="mt-5 p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className="bg-brand-orange/10 text-brand-orange p-2 rounded-lg">
                <Mail size={18} />
              </div>
              <h3 className="font-bold text-lg">Emails de Contacto</h3>
            </div>
            <button 
              onClick={addEmail}
              className="p-2 text-brand-orange hover:bg-brand-orange/10 rounded-lg transition-all"
              title="Añadir email"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {(branding?.emails || (branding?.email ? [branding.email] : [''])).map((email, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-grow space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Correo {index + 1}</label>
                  <input 
                    type="email" 
                    defaultValue={email}
                    onBlur={(e) => updateEmail(index, e.target.value)}
                    placeholder="pedidos@averal.com"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-brand-orange" 
                  />
                </div>
                {index > 0 && (
                  <button 
                    onClick={() => removeEmail(index)}
                    className="mt-5 p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Locations Management */}
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg">Nuestras Ubicaciones</h3>
          <button
            onClick={() => { setEditingLocation(null); reset(); setIsModalOpen(true); }}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Nueva Ubicación</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {locations.map((loc) => (
            <div key={loc.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-start gap-4">
              <div className="flex-grow">
                <h4 className="font-bold text-brand-black mb-2">{loc.title}</h4>
                <p className="text-gray-500 text-sm mb-2">{loc.address}</p>
                {loc.hours && (
                  <div className="flex items-center space-x-2 text-brand-orange font-bold text-xs">
                    <Clock size={14} />
                    <span>{loc.hours}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <button onClick={() => handleEdit(loc)} className="p-2 text-gray-400 hover:text-brand-orange hover:bg-brand-orange/5 rounded-lg transition-all">
                  <Edit2 size={18} />
                </button>
                <button onClick={() => handleDelete(loc.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-brand-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full relative z-10 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black tracking-tighter uppercase">
                  {editingLocation ? 'Editar Ubicación' : 'Nueva Ubicación'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Título / Nombre del Patio</label>
                  <input
                    {...register('title', { required: true })}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-brand-orange"
                    placeholder="Ej: Patio Principal - Zumpango"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Dirección Completa</label>
                  <textarea
                    {...register('address', { required: true })}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-brand-orange resize-none"
                    placeholder="Calle, Número, Colonia, Ciudad, Estado, CP"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Horario de Atención (Opcional)</label>
                  <input
                    {...register('hours')}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-brand-orange"
                    placeholder="Ej: Lun - Sáb: 9:00 AM - 6:00 PM"
                  />
                  <p className="text-[10px] text-gray-400">Si se deja vacío, no se mostrará el icono de reloj en la web.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Enlace de Google Maps (Opcional)</label>
                  <input
                    {...register('googleMapsUrl')}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-brand-orange"
                    placeholder="https://goo.gl/maps/..."
                  />
                  <p className="text-[10px] text-gray-400">Pega aquí el enlace de "Compartir" de Google Maps.</p>
                </div>
                <button type="submit" className="btn-primary w-full flex items-center justify-center space-x-2">
                  <Save size={20} />
                  <span>{editingLocation ? 'Guardar Cambios' : 'Crear Ubicación'}</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AdminsSection = () => {
  const [admins, setAdmins] = useState<{ id: string; email: string }[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const data = await getAllowedAdmins();
      setAdmins(data);
    } catch (error) {
      console.error("Error fetching admins:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!newEmail || !newEmail.includes('@')) return;
    try {
      await addAllowedAdmin(newEmail);
      setNewEmail('');
      fetchAdmins();
    } catch (error) {
      console.error("Error adding admin:", error);
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    try {
      await deleteAllowedAdmin(id);
      fetchAdmins();
    } catch (error) {
      console.error("Error deleting admin:", error);
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="max-w-2xl space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="bg-brand-orange/10 text-brand-orange p-2 rounded-lg">
            <ShieldCheck size={18} />
          </div>
          <h3 className="font-bold text-lg">Añadir Administrador</h3>
        </div>
        <div className="flex gap-4">
          <input
            type="email"
            placeholder="correo@gmail.com"
            className="flex-grow px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-brand-orange"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <button onClick={handleAddAdmin} className="btn-primary">Añadir</button>
        </div>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
          Solo los correos en esta lista podrán acceder al panel de administración.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4 mb-4">Administradores con Acceso</h3>
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {/* Super Admin (Hardcoded) */}
            <div className="px-6 py-4 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="font-bold text-sm">menaricardo333@gmail.com</span>
                <span className="text-[10px] font-black text-brand-orange uppercase tracking-widest bg-brand-orange/10 px-2 py-0.5 rounded">Super Admin</span>
              </div>
            </div>
            
            {admins.map((admin) => (
              <div key={admin.id} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="font-bold text-sm">{admin.email}</span>
                </div>
                <button 
                  onClick={() => handleDeleteAdmin(admin.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const LegalSection = () => {
  const { draftContent, updateDraft, saveChanges } = useContent();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await saveChanges();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving legal content:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h3 className="text-lg font-black tracking-tighter uppercase">Gestión Legal</h3>
          <p className="text-xs text-gray-500 font-medium">Guarda los cambios para que se reflejen en el sitio web.</p>
        </div>
        <div className="flex items-center space-x-4">
          <AnimatePresence>
            {saveSuccess && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-green-500 text-xs font-bold uppercase tracking-widest"
              >
                ¡Guardado con éxito!
              </motion.span>
            )}
          </AnimatePresence>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary px-8 py-3 flex items-center space-x-2 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Save size={20} />
            )}
            <span>Guardar Cambios</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3 mb-8">
          <div className="bg-brand-orange/10 p-2 rounded-xl">
            <FileText className="text-brand-orange" size={24} />
          </div>
          <h3 className="text-xl font-black tracking-tighter uppercase">Aviso de Privacidad</h3>
        </div>
        <textarea
          value={draftContent?.legal?.privacyPolicy || ''}
          onChange={(e) => updateDraft('legal.privacyPolicy', e.target.value)}
          rows={10}
          className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-orange resize-none text-gray-600 leading-relaxed"
          placeholder="Escribe el aviso de privacidad aquí..."
        />
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3 mb-8">
          <div className="bg-brand-orange/10 p-2 rounded-xl">
            <FileText className="text-brand-orange" size={24} />
          </div>
          <h3 className="text-xl font-black tracking-tighter uppercase">Términos y Condiciones</h3>
        </div>
        <textarea
          value={draftContent?.legal?.termsAndConditions || ''}
          onChange={(e) => updateDraft('legal.termsAndConditions', e.target.value)}
          rows={10}
          className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-orange resize-none text-gray-600 leading-relaxed"
          placeholder="Escribe los términos y condiciones aquí..."
        />
      </div>
    </div>
  );
};

const ReviewsSection = ({ openConfirm }: { openConfirm: any }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      photoUrl: '',
      text: '',
      rating: 5,
      role: ''
    }
  });

  const photoUrl = watch('photoUrl');

  useEffect(() => {
    const q = query(reviewsRef, orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Review)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const onSubmit = async (data: any) => {
    try {
      if (editingReview) {
        await updateReview(editingReview.id, data);
      } else {
        await addReview(data);
      }
      setIsModalOpen(false);
      setEditingReview(null);
      reset();
    } catch (error) {
      console.error("Error saving review:", error);
    }
  };

  const handleEdit = (review: Review) => {
    setEditingReview(review);
    setValue('name', review.name);
    setValue('photoUrl', review.photoUrl);
    setValue('text', review.text);
    setValue('rating', review.rating);
    setValue('role', review.role || '');
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    openConfirm(
      '¿Eliminar Reseña?',
      'Esta reseña dejará de mostrarse en el sitio web.',
      async () => {
        await deleteReview(id);
      }
    );
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg">Reseñas de Clientes</h3>
        <button
          onClick={() => { setEditingReview(null); reset(); setIsModalOpen(true); }}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Nueva Reseña</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-4">
                <img 
                  src={review.photoUrl || 'https://via.placeholder.com/150'} 
                  alt={review.name} 
                  className="w-12 h-12 rounded-full object-cover border-2 border-brand-orange/20"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="font-bold text-brand-black">{review.name}</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{review.role || 'Cliente'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button onClick={() => handleEdit(review)} className="p-2 text-gray-400 hover:text-brand-orange hover:bg-brand-orange/5 rounded-lg transition-all">
                  <Edit2 size={18} />
                </button>
                <button onClick={() => handleDelete(review.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <div className="flex text-brand-orange mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} />
              ))}
            </div>
            <p className="text-gray-500 text-sm italic">"{review.text}"</p>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-brand-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full relative z-10 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black tracking-tighter uppercase">
                  {editingReview ? 'Editar Reseña' : 'Nueva Reseña'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex flex-col items-center mb-6">
                  <div className="relative group">
                    <img 
                      src={photoUrl || 'https://via.placeholder.com/150'} 
                      alt="Preview" 
                      className="w-24 h-24 rounded-full object-cover border-4 border-gray-50 shadow-md"
                      referrerPolicy="no-referrer"
                    />
                    <div 
                      onClick={() => setIsGalleryModalOpen(true)}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                    >
                      <ImageIcon size={20} />
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Foto del Cliente</p>
                </div>

                <GalleryModal 
                  isOpen={isGalleryModalOpen}
                  onClose={() => setIsGalleryModalOpen(false)}
                  onSelect={(urls) => setValue('photoUrl', urls[0])}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nombre del Cliente</label>
                    <input
                      {...register('name', { required: true })}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-brand-orange"
                      placeholder="Ej: Juan Pérez"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cargo / Empresa (Opcional)</label>
                    <input
                      {...register('role')}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-brand-orange"
                      placeholder="Ej: Gerente de Logística"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Calificación</label>
                  <select
                    {...register('rating', { valueAsNumber: true })}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-brand-orange"
                  >
                    {[5, 4, 3, 2, 1].map(num => (
                      <option key={num} value={num}>{num} Estrellas</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Reseña</label>
                  <textarea
                    {...register('text', { required: true, maxLength: 200 })}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-brand-orange resize-none"
                    placeholder="Escribe el testimonio aquí (máx. 200 caracteres)..."
                  />
                  <div className="flex justify-end">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {watch('text')?.length || 0}/200
                    </span>
                  </div>
                </div>

                <button type="submit" className="btn-primary w-full flex items-center justify-center space-x-2">
                  <Save size={20} />
                  <span>{editingReview ? 'Guardar Cambios' : 'Publicar Reseña'}</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FAQSection = ({ openConfirm }: { openConfirm: any }) => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, reset, setValue } = useForm<Omit<FAQ, 'id'>>();

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      const data = await getFAQs();
      setFaqs(data);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: Omit<FAQ, 'id'>) => {
    try {
      if (editingFaq) {
        await updateFAQ(editingFaq.id, data);
      } else {
        await addFAQ({ ...data, order: faqs.length });
      }
      setIsModalOpen(false);
      setEditingFaq(null);
      reset();
      fetchFaqs();
    } catch (error) {
      console.error("Error saving FAQ:", error);
    }
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFaq(faq);
    setValue('question', faq.question);
    setValue('answer', faq.answer);
    setValue('order', faq.order);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    openConfirm(
      '¿Eliminar Pregunta?',
      'Esta pregunta frecuente dejará de mostrarse en la sección de ayuda.',
      async () => {
        await deleteFAQ(id);
        fetchFaqs();
      }
    );
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg">Preguntas Frecuentes</h3>
        <button
          onClick={() => { setEditingFaq(null); reset(); setIsModalOpen(true); }}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Nueva Pregunta</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {faqs.map((faq) => (
          <div key={faq.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-start gap-4">
            <div className="flex-grow">
              <h4 className="font-bold text-brand-black mb-2">{faq.question}</h4>
              <p className="text-gray-500 text-sm">{faq.answer}</p>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button onClick={() => handleEdit(faq)} className="p-2 text-gray-400 hover:text-brand-orange hover:bg-brand-orange/5 rounded-lg transition-all">
                <Edit2 size={18} />
              </button>
              <button onClick={() => handleDelete(faq.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-brand-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full relative z-10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black tracking-tighter uppercase">
                  {editingFaq ? 'Editar Pregunta' : 'Nueva Pregunta'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pregunta</label>
                  <input
                    {...register('question', { required: true })}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-brand-orange"
                    placeholder="¿Cómo funciona...?"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Respuesta</label>
                  <textarea
                    {...register('answer', { required: true })}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-brand-orange resize-none"
                    placeholder="Escribe la respuesta aquí..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Orden</label>
                  <input
                    type="number"
                    {...register('order', { valueAsNumber: true })}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-brand-orange"
                  />
                </div>
                <button type="submit" className="btn-primary w-full flex items-center justify-center space-x-2">
                  <Save size={20} />
                  <span>{editingFaq ? 'Guardar Cambios' : 'Crear Pregunta'}</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
