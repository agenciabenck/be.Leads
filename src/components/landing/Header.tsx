import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="absolute top-0 left-0 right-0 z-50 py-8">
      <div className="container mx-auto px-6 max-w-7xl flex items-center justify-center">

        {/* Logo Centered */}
        <a href="#" className="block hover:opacity-80 transition-opacity hover:scale-105 duration-300">
          <img
            src="https://i.postimg.cc/ZKTLpRxM/logo-beleads-h1-1.png"
            alt="Be.Leads"
            className="h-10 md:h-12 w-auto object-contain"
          />
        </a>

      </div>
    </header>
  );
};

export default Header;