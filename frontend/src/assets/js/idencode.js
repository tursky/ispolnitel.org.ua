// The algorithm is borrowed from an open source: http://www.tranzit.ltd.ua/ipn/

function subm(form) {
  var idd = document.getElementById('inn').value;
  var k1 = 0; // расчет контрольной цифры
  var k2 = 0; // расчет контрольной цифры
  var k3 = 0; // контрольная цифра расчета
  var k4 = 0; // последняя цифра ИНН для сравнения
  var k5 = 0; // расчет предпоследней цифры (четная-нечетная)
  var k6 = 0; // 0 - четное женское,  1 - нечетное мужское
  var k7 = 0; // 5 цифр даты

  var error2 = 0; // флаг ошибки

  document.getElementById('ginfo').value = '';
  document.getElementById('qpol').value = '';
  document.getElementById('qdata').value = '';

  var k1 =
    idd.charAt(0) * -1 +
    idd.charAt(1) * 5 +
    idd.charAt(2) * 7 +
    idd.charAt(3) * 9 +
    idd.charAt(4) * 4 +
    idd.charAt(5) * 6 +
    idd.charAt(6) * 10 +
    idd.charAt(7) * 5 +
    idd.charAt(8) * 7;
  var k2 = k1 - 11 * Math.floor(k1 / 11);
  var k4 = idd.charAt(9);
  var k5 = idd.charAt(8);
  var k6 = k5 - 2 * Math.floor(k5 / 2);

  if (k2 == 10) {
    var k3 = '0';
  } else {
    var k3 = k2;
  }

  if (k4 != k3) {
    var error2 = 1;
    document.getElementById('ginfo').value =
      // 'РНОКПП з помилкою; остання (контрольна) цифра повинна бути ' + k3;
      'Не ідентифіковано';
    document.getElementById('qpol').value = '';
    document.getElementById('qdata').value = '';
  } else {
    function getJsDateFromExcel(excelDate) {
      return new Date((excelDate - (25567 + 1)) * 86400 * 1000);
    }

    if (idd.length == 10) {
      var k7 = idd.substring(0, 5);
      var k7 = k7 * 1;
    } else {
      var k7 = idd.substring(0, 4);
      var k7 = k7 * 1;
    }

    var ddd = getJsDateFromExcel(k7);
    var d1 = 0;
    var d2 = 0;
    if (ddd.getDate() < 10) {
      d1 = '0' + ddd.getDate();
    } else {
      d1 = ddd.getDate();
    }
    if (ddd.getMonth() + 1 < 10) {
      d2 = '0' + (ddd.getMonth() + 1);
    } else {
      d2 = ddd.getMonth() + 1;
    }

    document.getElementById('ginfo').value = '';
    document.getElementById('qdata').value =
      d1 + '.' + d2 + '.' + ddd.getFullYear();
    if (k6 == 0) {
      document.getElementById('qpol').value = 'жінка';
    } else {
      document.getElementById('qpol').value = 'чоловік';
    }
  }
  return false;
}

function subx(form) {
  var drd = document.getElementById('dr').value;
  var day1 = drd.substr(0, 2);
  var month1 = drd.substr(3, 2);
  var year1 = drd.substr(6, 4);

  var txt = day1 * 1 + month1 * 1 + year1 * 1;

  document.getElementById('ginfo2').value = '';
  document.getElementById('dr0').value = '';

  if (txt > 0) {
    var erd = 0;
    var erm = 0;
    var erg = 0;

    if (year1 * 1 < 1900) {
      erg = 1;
    }
    if (month1 * 1 > 12) {
      erm = 1;
    }
    if (month1 * 1 < 1) {
      erm = 1;
    }
    if (day1 * 1 < 1) {
      erd = 1;
    }
    if (day1 * 1 > 31) {
      erd = 1;
    }

    var erg = erg + erm + erd;

    if (erg == 0) {
      first_date = '31.12.1899 00:00';
      second_date = day1 + '.' + month1 + '.' + year1 + ' 00:00';
      first_array = first_date.match(
        /(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})/
      );
      second_array = second_date.match(
        /(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})/
      );
      first = Date.UTC(
        first_array[3],
        first_array[2] - 1,
        first_array[1],
        first_array[4],
        first_array[5]
      );
      second = Date.UTC(
        second_array[3],
        second_array[2] - 1,
        second_array[1],
        second_array[4],
        second_array[5]
      );
      days = Math.ceil((second - first) / (1000 * 60 * 60 * 24));

      document.getElementById('ginfo2').value = '';

      if (days < 10) {
        document.getElementById('dr0').value = '0000' + days;
      } else {
        if (days < 100) {
          document.getElementById('dr0').value = '000' + days;
        } else {
          if (days < 1000) {
            document.getElementById('dr0').value = '00' + days;
          } else {
            if (days < 10000) {
              document.getElementById('dr0').value = '0' + days;
            } else {
              document.getElementById('dr0').value = days;
            }
          }
        }
      }
    } else {
      document.getElementById('ginfo2').value =
        'Увага: дату введено з помилкою';
    }
  }

  return false;
}

// Added Enter and Clear buttons

let re_btn = document.getElementById('refresh-input');
re_btn.addEventListener('click', function (event) {
  let inn = document.getElementById('inn');
  let dr = document.getElementById('dr');
  let qdata = document.getElementById('qdata');
  let qpol = document.getElementById('qpol');
  let ginfo = document.getElementById('ginfo');
  let dr0 = document.getElementById('dr0');
  inn.value = '';
  dr.value = '';
  qdata.value = '';
  qpol.value = '';
  ginfo.value = '';
  dr0.value = '';
});

let en_btn = document.getElementById('enter-btn');
en_btn.addEventListener('click', function (event) {
  let inn = document.getElementById('inn');
  return subm(inn.value);
});

let dr_btn = document.getElementById('birthday-btn');
dr_btn.addEventListener('click', function (event) {
  let dr = document.getElementById('dr');
  return subx(dr.value);
});
