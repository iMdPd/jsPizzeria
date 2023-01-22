import { classNames, select, settings, templates } from '../settings.js';
import utils from '../utils.js';
import AmountWidget from '../components/AmountWidget.js';
import DatePicker from '../components/DatePicker.js';
import HourPicker from '../components/HourPicker.js';

class Booking {
  constructor(element) {
    const thisBooking = this;

    thisBooking.selectedTable = [];
    thisBooking.selectedStarters = [];

    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
  }

  getData() {
    const thisBooking = this;

    const startDateParam =
      settings.db.dateStartParamKey +
      '=' +
      utils.dateToStr(thisBooking.datePicker.minDate);

    const endDateParam =
      settings.db.dateEndParamKey +
      '=' +
      utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [startDateParam, endDateParam],

      eventsCurrent: [settings.db.notRepeatParam, startDateParam, endDateParam],

      eventsRepeat: [settings.db.repeatParam, endDateParam],
    };

    // console.log('detData params :', params);

    const urls = {
      bookings:
        settings.db.url +
        '/' +
        settings.db.bookings +
        '?' +
        params.booking.join('&'),

      eventsCurrent:
        settings.db.url +
        '/' +
        settings.db.events +
        '?' +
        params.eventsCurrent.join('&'),

      eventsRepeat:
        settings.db.url +
        '/' +
        settings.db.events +
        '?' +
        params.eventsRepeat.join('&'),
    };
    // console.log('detData urls :', urls);
    Promise.all([
      fetch(urls.bookings),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function (allResponses) {
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function ([bookings, eventsCurrent, eventsRepeat]) {
        // console.log('bookings: ', bookings);
        // console.log('eventsCurrent: ', eventsCurrent);
        // console.log('eventsRepeat: ', eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;

    thisBooking.booked = {};

    for (let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for (let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for (let item of eventsRepeat) {
      if (item.repeat == 'daily') {
        for (
          let loopDate = minDate;
          loopDate <= maxDate;
          loopDate = utils.addDays(loopDate, 1)
        ) {
          thisBooking.makeBooked(
            utils.dateToStr(loopDate),
            item.hour,
            item.duration,
            item.table
          );
        }
      }
    }

    // console.log('thisBooking.booked', thisBooking.booked);
    thisBooking.updateDOM();
  }

  updateDOM() {
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if (
      typeof thisBooking.booked[thisBooking.date] == 'undefined' ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] ==
        'undefined'
    ) {
      allAvailable = true;
    }

    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }

      if (
        !allAvailable &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if (typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for (
      let hourBlock = startHour;
      hourBlock < startHour + duration;
      hourBlock += 0.5
    ) {
      // console.log('loop', hourBlock);
      if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }

      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  render(element) {
    const thisBooking = this;

    const generatedHTML = templates.bookingWidget();
    thisBooking.element = utils.createDOMFromHTML(generatedHTML);
    const bookingContainer = document.querySelector(select.containerOf.booking);
    bookingContainer.appendChild(thisBooking.element).innerHTML;

    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.peopleAmount = element.querySelector(
      select.booking.peopleAmount
    );
    thisBooking.dom.hoursAmount = element.querySelector(
      select.booking.hoursAmount
    );
    thisBooking.dom.datePicker = element.querySelector(
      select.widgets.datePicker.wrapper
    );
    thisBooking.dom.hourPicker = element.querySelector(
      select.widgets.hourPicker.wrapper
    );
    thisBooking.dom.tables = element.querySelectorAll(select.booking.tables);
    thisBooking.dom.floorPlan = element.querySelector(select.booking.floorPlan);
    thisBooking.dom.form = element.querySelector(select.booking.form);
    thisBooking.dom.phone = element.querySelector(select.booking.phone);
    thisBooking.dom.address = element.querySelector(select.booking.address);
    thisBooking.dom.button = element.querySelector(select.booking.button);
    thisBooking.dom.starterContainer = thisBooking.dom.form.querySelector(
      select.booking.starters
    );
  }

  initTables(clickedTable) {
    const thisBooking = this;

    // console.log('tableData', tableData);

    /* if it's true that clickedTable contains class 'table' */
    if (clickedTable.classList.contains('table')) {
      // console.log('Table is clicked!', clickedTable);

      /* if it's true that clickedTable contains class 'booked' */
      if (clickedTable.classList.contains(classNames.booking.tableBooked)) {
        /* display alert with notification about already booked table */
        alert(settings.notification.booked);
        /* otherwise, if it's false that clickedTable doesn't contains class 'booked' */
      } else {
        if (clickedTable.classList.contains(classNames.booking.tableSelected)) {
          clickedTable.classList.remove(classNames.booking.tableSelected);
          thisBooking.selectedTable = [];
        } else {
          for (let table of thisBooking.dom.tables) {
            table.classList.remove(classNames.booking.tableSelected);
          }

          clickedTable.classList.add(classNames.booking.tableSelected);

          /* get attribute 'get-data' from clickedTable */
          const tableData = clickedTable.getAttribute(
            settings.booking.tableIdAttribute
          );

          thisBooking.selectedTable = [tableData];
        }
        // console.log('selectedTable', thisBooking.selectedTable);
      }
    }
  }

  initWidgets() {
    const thisBooking = this;

    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.dom.peopleAmount.addEventListener('updated', function () {});

    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.dom.hoursAmount.addEventListener('updated', function () {});

    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.dom.datePicker.addEventListener('updated', function () {});

    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);
    thisBooking.dom.hourPicker.addEventListener('updated', function () {});

    thisBooking.dom.floorPlan.addEventListener('click', function (event) {
      const clickedTable = event.target;
      thisBooking.initTables(clickedTable);
    });

    thisBooking.dom.starterContainer.addEventListener(
      'change',
      function (event) {
        const clickedCheckbox = event.target;
        thisBooking.selectedInput(clickedCheckbox);
      }
    );

    thisBooking.dom.wrapper.addEventListener('updated', function (event) {
      thisBooking.updateDOM();
      if (
        event.target == thisBooking.dom.hourPicker ||
        event.target == thisBooking.dom.datePicker ||
        event.target == thisBooking.dom.peopleAmount ||
        event.target == thisBooking.dom.hoursAmount
      ) {
        thisBooking.selectedTable = [];
        for (let table of thisBooking.dom.tables) {
          table.classList.remove('selected');
        }
      }
    });

    thisBooking.dom.form.addEventListener('submit', function (event) {
      event.preventDefault();
      thisBooking.sendBooking();
      thisBooking.updateDOM();
    });
  }

  selectedInput(clickedCheckbox) {
    const thisBooking = this;
    /* make new constant named "inputValue" and give it the 'value' attribute of clicked input  */
    const inputValue = clickedCheckbox.getAttribute('value');
    // console.log('inputValue:', inputValue);
    /* check if input is checked */
    if (clickedCheckbox.checked == true) {
      /* push inputValue to selectedStarters array */

      thisBooking.selectedStarters.push(inputValue);
    } else {
      const removeValue = thisBooking.selectedStarters.indexOf(inputValue);

      thisBooking.selectedStarters.splice(removeValue, 1);
    }
    // console.log('selectedStarters :', thisBooking.selectedStarters);
  }

  sendBooking() {
    const thisBooking = this;

    const url = settings.db.url + '/' + settings.db.bookings;

    const payload = {
      date: thisBooking.datePicker.correctValue,
      hour: thisBooking.hourPicker.correctValue,
      table: thisBooking.convertTableData(),
      duration: thisBooking.hoursAmount.correctValue,
      ppl: thisBooking.peopleAmount.correctValue,
      starters: [],
      phone: thisBooking.dom.phone.value,
      address: thisBooking.dom.address.value,
    };
    // console.log('BookingsPayload :', payload);

    for (let starter of thisBooking.selectedStarters) {
      payload.starters.push(starter);
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options)
      .then(function (rawResponse) {
        return rawResponse.json();
      })
      .then(function (parsedResponse) {
        console.log('parsedResponse', parsedResponse);
        thisBooking.makeBooked(
          payload.date,
          payload.hour,
          payload.duration,
          payload.table
        );
        thisBooking.updateDOM();
        for (let table of thisBooking.dom.tables) {
          table.classList.remove('selected');
        }
      });
  }

  convertTableData() {
    const thisBooking = this;

    if (thisBooking.selectedTable.length != 0) {
      return parseInt(thisBooking.selectedTable[0]);
    } else {
      return null;
    }
  }
}

export default Booking;
