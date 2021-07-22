import { Directive, TemplateRef, ViewContainerRef, Input, Renderer2, OnInit } from '@angular/core';

@Directive({
  selector: '[appStaticHtml]'
})
export class StaticHtmlDirective implements OnInit {

  @Input('appStaticHtml') innerHTML: string = '';
 
  constructor(
    private renderer: Renderer2,
    private templateRef: TemplateRef<any>,
    private viewContainerRef: ViewContainerRef,
  ) { }

  ngOnInit(): void {
    this.viewContainerRef.remove();
    const embeddedViewRef = this.viewContainerRef.createEmbeddedView(this.templateRef);
    this.renderer.setProperty(embeddedViewRef.rootNodes[0], 'innerHTML', this.innerHTML);
  }
}