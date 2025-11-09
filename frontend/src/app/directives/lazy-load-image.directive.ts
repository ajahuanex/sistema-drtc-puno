import { Directive, ElementRef, Input, OnInit, OnDestroy, inject } from '@angular/core';

/**
 * Directive for lazy loading images using Intersection Observer
 * Optimizes image loading by only loading images when they enter the viewport
 */
@Directive({
  selector: 'img[appLazyLoad]',
  standalone: true
})
export class LazyLoadImageDirective implements OnInit, OnDestroy {
  @Input() appLazyLoad: string = '';
  @Input() placeholder: string = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3C/svg%3E';
  
  private el = inject(ElementRef);
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    // Set placeholder initially
    this.el.nativeElement.src = this.placeholder;
    
    // Create intersection observer
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage();
          }
        });
      },
      {
        rootMargin: '50px' // Start loading 50px before entering viewport
      }
    );

    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private loadImage(): void {
    const img = this.el.nativeElement;
    
    if (this.appLazyLoad) {
      // Create a new image to preload
      const tempImg = new Image();
      
      tempImg.onload = () => {
        img.src = this.appLazyLoad;
        img.classList.add('loaded');
      };
      
      tempImg.onerror = () => {
        img.classList.add('error');
      };
      
      tempImg.src = this.appLazyLoad;
      
      // Disconnect observer after loading
      if (this.observer) {
        this.observer.disconnect();
      }
    }
  }
}
