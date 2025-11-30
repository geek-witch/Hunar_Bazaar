import React from 'react';
import { Page, Navigation } from '../App';
import { FacebookIcon, InstagramIcon, TwitterIcon } from './icons/SocialIcons';

interface FooterProps {
  navigation: Navigation;
}

const Footer: React.FC<FooterProps> = ({ navigation }) => {
  return (
    <footer className="bg-brand-teal text-white">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-center md:text-left">
          <div className="md:col-span-4">
            <h2 className="text-2xl font-bold mb-2">HunarBazaar</h2>
            <p className="text-gray-300 md:pr-4">A platform to exchange skills and knowledge, empowering individuals and building communities.</p>
          </div>
          
          <div className="md:col-span-2">
            <h3 className="font-semibold mb-4 uppercase">Links</h3>
            <ul className="space-y-2">

              <li>
                <a 
                  onClick={() => navigation.navigateTo(Page.AboutUs)} 
                  className="hover:underline text-gray-300 cursor-pointer"
                >
                  About Us
                </a>
              </li>
              <li>
                <a 
                 onClick={() => navigation.navigateTo(Page.Contact)} 
                 className="hover:underline text-gray-300 cursor-pointer">
                  Contact
                 </a>
              </li>


            </ul>
          </div>

          <div className="md:col-span-2">
            <h3 className="font-semibold mb-4 uppercase">Follow Us</h3>
            <div className="flex space-x-4 justify-center md:justify-start">
              <a href="#" className="text-gray-300 hover:text-white transition-colors"><FacebookIcon className="w-6 h-6" /></a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors"><InstagramIcon className="w-6 h-6" /></a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors"><TwitterIcon className="w-6 h-6" /></a>
            </div>
          </div>

          <div className="md:col-span-4">
            <h3 className="font-semibold mb-4 uppercase">Subscribe</h3>
            <p className="text-gray-300 mb-4">Stay updated with our latest news and offers.</p>
            <form className="flex flex-col sm:flex-row">
              <input type="email" placeholder="Enter your email" className="w-full px-4 py-2 rounded-md sm:rounded-l-md sm:rounded-r-none text-gray-800 focus:outline-none mb-2 sm:mb-0" />
              <button type="submit" className="bg-white text-brand-teal px-6 py-2 rounded-md sm:rounded-r-md sm:rounded-l-none font-semibold hover:bg-gray-200 transition-colors">
                Start
              </button>
            </form>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-700 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} HunarBazaar. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;