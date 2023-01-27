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
    console.log(generatedHTML);
    thisHome.dom.wrapper.innerHTML = generatedHTML;
  }

  initWidgets() {
    const elem = document.querySelector(select.containerOf.carousel);
    // console.log(elem);
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
    // console.log(flkty);
  }
}

export default Home;
