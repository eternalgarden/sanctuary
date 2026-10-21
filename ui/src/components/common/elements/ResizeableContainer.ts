import { FASTElement, customElement, html, observable } from "@microsoft/fast-element";

// >
// 

const template = html<ResizeableContainer>`
  <div 
    class="container" style="width: ${x => x.width}px; height: ${x => x.height}px">
    <slot>
  </div>
  <p>${x => x.width}</p>
`;

@customElement({
  name: 'resizeable-container',
  template,
})
export class ResizeableContainer extends FASTElement
{
  @observable width: number;
  @observable height: number;

  setSize(width: number, height: number) {
    this.width = width;
    this.height = height;

    console.log("whatt")
  }
}