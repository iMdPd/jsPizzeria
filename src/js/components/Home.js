import { select, templates } from '../settings.js';

class Home {
  constructor(element) {
    const thisHome = this;

    thisHome.render(element);
    thisHome.initWidgets();
  }

  render(element) {
    const thisHome = this;

    thisHome.dom = {};
    thisHome.dom.wrapper = element;

    const generatedHTML = templates.homeWidget();
    thisHome.dom.wrapper.innerHTML = generatedHTML;
  }

  initWidgets() {
    const elem = document.querySelector(select.containerOf.carousel);
    /* eslint-disable */
    const flkty = new Flickity(elem, {
      /* eslint-enable */
      // options
      cellAlign: 'left',
      contain: true,
      autoPlay: 3000,
      pauseAutoPlayOnHover: false,
      prevNextButtons: false,
    });
  }
}

export default Home;
