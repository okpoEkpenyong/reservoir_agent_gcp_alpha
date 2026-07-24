import React, { useState } from 'react';
import { 
  Menu, 
  X, 
  ChevronDown, 
  Home, 
  Info, 
  Briefcase, 
  Mail 
} from 'lucide-react';
import styles from "../App.module.css";
import logo_src from "../../assets/exlogo9.jpeg"

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const toggleNavbar = () => setIsOpen(!isOpen);

  const menuItems = [
   /**  
    { name: 'Home', icon: Home, link: '#' }, 
   { 
      name: 'About', 
      icon: Info, 
      link: '#',
      dropdown: ['Our Story', 'Team', 'Careers']
    },
    { 
      name: 'Services', 
      icon: Briefcase, 
      link: '#',
      dropdown: ['Web Design', 'Development', 'SEO']
    },
   **/
   { name: 'Contact', icon: Mail, link: '/feedback' }
  ];
  
  return (
    <nav className="bg-white shadow-md fixed w-full z-50 top-0 left-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex-shrink-0 font-bold text-xl text-indigo-600">
		  <img
              src={logo_src}
              className={styles.appLogo}
              alt="Exzing"
          />
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div 
                  key={index}
                  className="relative"
                  onMouseEnter={() => item.dropdown && setActiveDropdown(index)}
                  onMouseLeave={() => item.dropdown && setActiveDropdown(null)}
                >
                  <a 
                    href={item.link}
                    className="flex items-center text-gray-600 hover:text-indigo-600 font-medium transition-colors duration-200 py-2"
                  >
                    <Icon className="w-5 h-5 mr-1" />
                    {item.name}
                    {item.dropdown && <ChevronDown className="w-4 h-4 ml-1" />}
                  </a>

                  {/* Desktop Dropdown */}
                  {item.dropdown && activeDropdown === index && (
                    <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5">
                      {item.dropdown.map((subItem, subIndex) => (
                        <a 
                          key={subIndex}
                          href="#"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          {subItem}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden">
            <button 
              onClick={toggleNavbar}
              className="text-gray-600 hover:text-indigo-600 p-2 focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-4 space-y-1">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index}>
                  <a 
                    href={item.link}
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-indigo-600 hover:bg-gray-50"
                  >
                    <Icon className="w-5 h-5 mr-2" />
                    {item.name}
                  </a>
                  {/* Mobile Dropdown Sub-items */}
                  {item.dropdown && (
                    <div className="pl-8 pr-3 py-1 space-y-1">
                      {item.dropdown.map((subItem, subIndex) => (
                        <a
                          key={subIndex}
                          href="#"
                          className="block py-2 text-sm text-gray-500 hover:text-indigo-600"
                        >
                          {subItem}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
