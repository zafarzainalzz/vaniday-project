
function getCurrentRole() {
    return localStorage.getItem('vanidayRole');
}

function getCurrentName() {
    return localStorage.getItem('vanidayName');
}

function logoutUser() {
    localStorage.removeItem('vanidayRole');
    localStorage.removeItem('vanidayName');
    localStorage.removeItem('ownerAssignedShop');
    window.location.href = 'index.html';
}

function getOwnerRealName() {
    var savedName = getCurrentName();
    var realName = savedName;

    if (savedName != null && savedName.indexOf('_') != -1) {
        realName = savedName.substring(savedName.indexOf('_') + 1);
    }

    return realName;
}

function getOwnerShopName() {
    var savedName = getCurrentName();
    var shopName = localStorage.getItem('ownerAssignedShop');

    if (shopName != null && shopName != '') {
        return shopName;
    }

    if (savedName == null) {
        return '';
    }

    var lowerName = savedName.toLowerCase();

    if (lowerName.indexOf('glowbeautysalon') == 0) {
        return 'Glow Beauty Salon';
    }
    else if (lowerName.indexOf('womenfree') == 0) {
        return 'Women-Free';
    }
    else if (lowerName.indexOf('luxuryspa') == 0 || lowerName.indexOf('luxeryspa') == 0) {
        return 'Luxury Spa';
    }
    else if (lowerName.indexOf('wellnesscenter') == 0) {
        return 'Wellness Center';
    }
    else if (lowerName.indexOf('makeupstudio') == 0) {
        return 'Make Up Studio';
    }
    else if (lowerName.indexOf('elitebarber') == 0) {
        return 'Elite Barber';
    }
    else if (lowerName.indexOf('manlymanesalon') == 0) {
        return 'Manly Mane Salon';
    }
    else if (lowerName.indexOf('blinkglam') == 0) {
        return 'Blink Glam';
    }
    else if (lowerName.indexOf('cosmostattooart') == 0) {
        return 'Cosmos Tattoo Art';
    }
    else if (lowerName.indexOf('thenailhub') == 0 || lowerName.indexOf('nailhub') == 0) {
        return 'The Nail Hub';
    }

    return '';
}

function renderVanidayNav() {
    var role = getCurrentRole();
    var navDiv = document.querySelector('nav div');

    if (navDiv == null) {
        return;
    }

    if (role == 'Customer') {
        navDiv.innerHTML = '<a href="index.html">Home</a><a href="merchants.html">Merchants</a><a href="booking.html">Book</a><a href="my-booking.html">My Bookings</a><a href="index.html" onclick="logoutUser()">Logout</a>';
    }
    else if (role == 'Shop Owner') {
        navDiv.innerHTML = '<a href="index.html">Home</a><a href="merchants.html">Merchants</a><a href="shop-owner-dashboard.html">Shop Dashboard</a><a href="index.html" onclick="logoutUser()">Logout</a>';
    }
    else if (role == 'Merchant Admin') {
        navDiv.innerHTML = '<a href="index.html">Home</a><a href="merchants.html">Merchants</a><a href="merchant-admin.html">Dashboard</a><a href="index.html" onclick="logoutUser()">Logout</a>';
    }
}

function protectCustomerOnlyPage() {
    var role = getCurrentRole();

    if (role == 'Shop Owner') {
        window.location.href = 'shop-owner-dashboard.html';
    }
    else if (role == 'Merchant Admin') {
        window.location.href = 'merchant-admin.html';
    }
}

function protectShopOwnerOnlyPage() {
    var role = getCurrentRole();

    if (role == 'Customer') {
        window.location.href = 'dashboard.html';
    }
    else if (role == 'Merchant Admin') {
        window.location.href = 'merchant-admin.html';
    }
}

function protectMerchantAdminOnlyPage() {
    var role = getCurrentRole();

    if (role == 'Customer') {
        window.location.href = 'dashboard.html';
    }
    else if (role == 'Shop Owner') {
        window.location.href = 'shop-owner-dashboard.html';
    }
}

function applyMerchantPageRules() {
    var role = getCurrentRole();
    var ownerShop = getOwnerShopName();
    var cards = document.querySelectorAll('.merchant-card');

    for (var i = 0; i < cards.length; i = i + 1) {
        var card = cards[i];
        var title = card.querySelector('h2');
        var button = card.querySelector('button');
        var shopName = '';

        if (title != null) {
            shopName = title.innerHTML;
        }

        if (role == 'Shop Owner' || role == 'Merchant Admin') {
            if (button != null) {
                button.style.display = 'none';
            }
        }

        if (role == 'Shop Owner' && shopName == ownerShop) {
            card.style.boxShadow = '0 0 30px rgba(255, 255, 255, 0.85), 0 0 65px rgba(245, 220, 170, 0.55)';
            card.style.border = '1px solid rgba(255, 255, 255, 0.75)';

            var ownerActions = card.querySelector('.owner-shop-actions');

            if (ownerActions == null) {
                ownerActions = document.createElement('div');
                ownerActions.className = 'owner-shop-actions';
                ownerActions.innerHTML = '<button onclick="window.location.href=\'shop-owner-dashboard.html#shopDetails\'">Update Shop</button><button onclick="window.location.href=\'shop-owner-dashboard.html#shopDetails\'">Delete Shop</button>';
                card.appendChild(ownerActions);
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    renderVanidayNav();
    applyMerchantPageRules();
});


function getBookingsList() {
    var bookingsText = localStorage.getItem('allBookings');
    var bookings = [];

    if (bookingsText != null && bookingsText != '') {
        bookings = JSON.parse(bookingsText);
    }

    return bookings;
}

function timeToMinutes(timeValue) {
    var hourText = timeValue.substring(0, 2);
    var minuteText = timeValue.substring(3, 5);
    var hourNumber = Number(hourText);
    var minuteNumber = Number(minuteText);
    return hourNumber * 60 + minuteNumber;
}

function isBookingTimeTaken(merchantName, bookingDate, bookingTime) {
    var bookings = getBookingsList();
    var newMinutes = timeToMinutes(bookingTime);
    var taken = false;

    for (var i = 0; i < bookings.length; i = i + 1) {
        if (bookings[i].merchant == merchantName && bookings[i].date == bookingDate) {
            var oldMinutes = timeToMinutes(bookings[i].time);
            var gap = newMinutes - oldMinutes;

            if (gap < 0) {
                gap = gap * -1;
            }

            if (gap < 60) {
                taken = true;
            }
        }
    }

    return taken;
}

function getBookingsForDate(roleShopName, dateValue) {
    var bookings = getBookingsList();
    var output = '';

    for (var i = 0; i < bookings.length; i = i + 1) {
        if (bookings[i].date == dateValue) {
            if (roleShopName == 'ALL' || bookings[i].merchant == roleShopName) {
                output = output + '<p><b>Shop:</b> ' + bookings[i].merchant + '</p>';
                output = output + '<p><b>Customer:</b> ' + bookings[i].customer + '</p>';
                output = output + '<p><b>Service:</b> ' + bookings[i].service + '</p>';
                output = output + '<p><b>Time:</b> ' + bookings[i].time + '</p><hr>';
            }
        }
    }

    if (output == '') {
        output = '<p>No bookings for this date.</p>';
    }

    return output;
}

function renderBookingCalendar(calendarId, detailsId, roleShopName) {
    var calendarBox = document.getElementById(calendarId);
    var detailBox = document.getElementById(detailsId);

    if (calendarBox == null || detailBox == null) {
        return;
    }

    var today = new Date();
    var year = today.getFullYear();
    var month = today.getMonth();
    var firstDate = new Date(year, month, 1);
    var lastDate = new Date(year, month + 1, 0);
    var startDay = firstDate.getDay();
    var monthNames = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec';
    var monthTitle = monthNames.split(' ')[month];
    var html = '<div class="calendar-title">' + monthTitle + ' ' + year + '</div>';
    html = html + '<div class="calendar-week">Sun</div><div class="calendar-week">Mon</div><div class="calendar-week">Tue</div><div class="calendar-week">Wed</div><div class="calendar-week">Thu</div><div class="calendar-week">Fri</div><div class="calendar-week">Sat</div>';

    for (var blank = 0; blank < startDay; blank = blank + 1) {
        html = html + '<div class="calendar-empty"></div>';
    }

    for (var day = 1; day <= lastDate.getDate(); day = day + 1) {
        var dateText = String(year) + '-';

        if (month + 1 < 10) {
            dateText = dateText + '0';
        }

        dateText = dateText + String(month + 1) + '-';

        if (day < 10) {
            dateText = dateText + '0';
        }

        dateText = dateText + String(day);

        var bookings = getBookingsList();
        var bookedClass = '';

        for (var i = 0; i < bookings.length; i = i + 1) {
            if (bookings[i].date == dateText) {
                if (roleShopName == 'ALL' || bookings[i].merchant == roleShopName) {
                    bookedClass = ' booked-day';
                }
            }
        }

        html = html + '<button class="calendar-day' + bookedClass + '" onclick="showCalendarDetails(\'' + roleShopName + '\',\'' + dateText + '\',\'' + detailsId + '\')">' + day + '</button>';
    }

    calendarBox.innerHTML = html;
}

function showCalendarDetails(roleShopName, dateValue, detailsId) {
    var detailBox = document.getElementById(detailsId);

    if (detailBox != null) {
        detailBox.innerHTML = '<h3>' + dateValue + '</h3>' + getBookingsForDate(roleShopName, dateValue);
    }
}
