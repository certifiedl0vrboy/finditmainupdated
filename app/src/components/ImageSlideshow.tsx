import { useState, useEffect, useCallback } from 'react';

interface ImageSlideshowProps {
  images: string[];
  interval?: number;
}

const ImageSlideshow = ({ images, interval = 5000 }: ImageSlideshowProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Preload images
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [images]);

  const advanceSlide = useCallback(() => {
    setIsLoaded(false);
    setCurrentIndex((prev) => {
      // Pick a random index different from the current one
      let next = Math.floor(Math.random() * (images.length - 1));
      if (next >= prev) next += 1;
      return next;
    });
    const timeout = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timeout);
  }, [images.length]);

  useEffect(() => {
    // Set initial loaded state
    const initialTimeout = setTimeout(() => setIsLoaded(true), 100);
    const timer = setInterval(advanceSlide, interval);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(timer);
    };
  }, [advanceSlide, interval]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {images.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
        >
          <img
            src={image}
            alt=""
            className={`w-full h-full object-cover transition-transform duration-[10000ms] ease-linear ${index === currentIndex && isLoaded ? 'scale-110' : 'scale-100'
              }`}
            style={{
              objectPosition: 'center center',
              minWidth: '100%',
              minHeight: '100%'
            }}
          />
        </div>
      ))}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Progress indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${index === currentIndex
              ? 'w-8 bg-kenyan-red'
              : 'w-2 bg-white/40 hover:bg-white/60'
              }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageSlideshow;
