
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
        realName = savedName.substring(0, savedName.indexOf('_'));
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

    var ownerCode = savedName;

    if (savedName.indexOf('_') != -1) {
        ownerCode = savedName.substring(savedName.indexOf('_') + 1);
    }

    var lowerName = cleanMerchantName(ownerCode);

    if (lowerName == 'glowbeautysalon' || lowerName == 'glowbautysalon') {
        return 'Glow Beauty Salon';
    }
    else if (lowerName == 'womenfree') {
        return 'Women-Free';
    }
    else if (lowerName == 'luxuryspa' || lowerName == 'luxeryspa') {
        return 'Luxury Spa';
    }
    else if (lowerName == 'wellnesscenter') {
        return 'Wellness Center';
    }
    else if (lowerName == 'makeupstudio') {
        return 'Make Up Studio';
    }
    else if (lowerName == 'elitebarber') {
        return 'Elite Barber';
    }
    else if (lowerName == 'manlymanesalon') {
        return 'Manly Mane Salon';
    }
    else if (lowerName == 'blinkglam') {
        return 'Blink Glam';
    }
    else if (lowerName == 'cosmostattooart') {
        return 'Cosmos Tattoo Art';
    }
    else if (lowerName == 'thenailhub' || lowerName == 'nailhub') {
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
            shopName = title.innerText;
        }

        if (isShopDeleted(shopName)) {
            card.style.display = 'none';
        }

        if (role == 'Shop Owner') {
            if (ownerShop == '' || !sameMerchantName(shopName, ownerShop)) {
                card.style.display = 'none';
            }
            else {
                card.style.display = 'block';
            }
        }

        if (title != null && title.querySelector('a') == null) {
            title.innerHTML = '<a class="shop-title-link" href="shop-detail.html?shop=' + encodeURIComponent(shopName) + '">' + shopName + '</a>';
        }

        var likeButton = card.querySelector('.merchant-like-btn');

        if (likeButton == null) {
            likeButton = card.querySelector('.heart-like-btn');
        }

        if (likeButton != null && shopName != '') {
            likeButton.innerHTML = getHeartText(shopName);
            likeButton.onclick = function() {
                var cardTitle = this.closest('.merchant-card').querySelector('h2');
                var cardShop = cardTitle.innerText;
                toggleShopLike(cardShop);
                refreshMerchantLikeButtons();
                moveLikedShopsToTop();
            };
        }
        else if (likeButton == null && shopName != '') {
            likeButton = document.createElement('button');
            likeButton.className = 'merchant-like-btn';
            likeButton.innerHTML = getHeartText(shopName);
            likeButton.onclick = function() {
                var cardTitle = this.closest('.merchant-card').querySelector('h2');
                var cardShop = cardTitle.innerText;
                toggleShopLike(cardShop);
                refreshMerchantLikeButtons();
                moveLikedShopsToTop();
            };
            card.appendChild(likeButton);
        }

        if (role == 'Shop Owner' || role == 'Merchant Admin') {
            if (button != null) {
                button.style.display = 'none';
            }
        }

        if (role == 'Shop Owner' && sameMerchantName(shopName, ownerShop)) {
            card.style.boxShadow = '0 0 30px rgba(255, 255, 255, 0.85), 0 0 65px rgba(245, 220, 170, 0.55)';
            card.style.border = '1px solid rgba(255, 255, 255, 0.75)';

            var ownerActions = card.querySelector('.owner-shop-actions');

            if (ownerActions == null) {
                ownerActions = document.createElement('div');
                ownerActions.className = 'owner-shop-actions shop-card-actions';
                ownerActions.innerHTML = '<button onclick="window.location.href=\'shop-owner-dashboard.html#shopDetails\'">Update</button>';
                card.appendChild(ownerActions);
            }
        }

        if (role == 'Merchant Admin') {
            var adminActions = card.querySelector('.admin-shop-actions');

            if (adminActions == null) {
                adminActions = document.createElement('div');
                adminActions.className = 'admin-shop-actions shop-card-actions';
                adminActions.innerHTML = '<button onclick="window.location.href=\'shop-detail.html?shop=' + encodeURIComponent(shopName) + '\'">Update</button><button onclick="toggleShopLike(\'' + shopName.replace(/'/g, '') + '\'); applyMerchantPageRules();">Like</button><button onclick="deleteShopFromMerchantPage(\'' + shopName.replace(/'/g, '') + '\')">Delete</button>';
                card.appendChild(adminActions);
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    renderVanidayNav();
    applyMerchantPageRules();
    refreshMerchantLikeButtons();
    moveLikedShopsToTop();
});


function getBookingsList() {
    var bookingsText = localStorage.getItem('allBookings');
    var bookings = [];

    if (bookingsText != null && bookingsText != '') {
        bookings = JSON.parse(bookingsText);
    }

    return bookings;
}

function cleanMerchantName(nameValue) {
    var cleanName = '';

    if (nameValue != null) {
        cleanName = nameValue.toLowerCase();
        cleanName = cleanName.replace(/ /g, '');
        cleanName = cleanName.replace(/-/g, '');
        cleanName = cleanName.replace(/'/g, '');
    }

    if (cleanName == 'luxeryspa') {
        cleanName = 'luxuryspa';
    }

    return cleanName;
}

function sameMerchantName(firstName, secondName) {
    var same = false;

    if (cleanMerchantName(firstName) == cleanMerchantName(secondName)) {
        same = true;
    }

    return same;
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
        if (sameMerchantName(bookings[i].merchant, merchantName) && bookings[i].date == bookingDate) {
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
            if (roleShopName == 'ALL' || sameMerchantName(bookings[i].merchant, roleShopName)) {
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

var ownerCalendarYear = new Date().getFullYear();
var ownerCalendarMonth = new Date().getMonth();
var adminCalendarYear = new Date().getFullYear();
var adminCalendarMonth = new Date().getMonth();

function getCalendarStateName(calendarId) {
    if (calendarId == 'adminCalendar') {
        return 'admin';
    }

    return 'owner';
}

function changeCalendarMonth(calendarId, detailsId, roleShopName, changeValue) {
    var stateName = getCalendarStateName(calendarId);

    if (stateName == 'admin') {
        adminCalendarMonth = adminCalendarMonth + changeValue;

        if (adminCalendarMonth < 0) {
            adminCalendarMonth = 11;
            adminCalendarYear = adminCalendarYear - 1;
        }
        else if (adminCalendarMonth > 11) {
            adminCalendarMonth = 0;
            adminCalendarYear = adminCalendarYear + 1;
        }
    }
    else {
        ownerCalendarMonth = ownerCalendarMonth + changeValue;

        if (ownerCalendarMonth < 0) {
            ownerCalendarMonth = 11;
            ownerCalendarYear = ownerCalendarYear - 1;
        }
        else if (ownerCalendarMonth > 11) {
            ownerCalendarMonth = 0;
            ownerCalendarYear = ownerCalendarYear + 1;
        }
    }

    renderBookingCalendar(calendarId, detailsId, roleShopName);
}

function renderBookingCalendar(calendarId, detailsId, roleShopName) {
    var calendarBox = document.getElementById(calendarId);
    var detailBox = document.getElementById(detailsId);

    if (calendarBox == null || detailBox == null) {
        return;
    }

    var stateName = getCalendarStateName(calendarId);
    var year = ownerCalendarYear;
    var month = ownerCalendarMonth;

    if (stateName == 'admin') {
        year = adminCalendarYear;
        month = adminCalendarMonth;
    }

    var firstDate = new Date(year, month, 1);
    var lastDate = new Date(year, month + 1, 0);
    var startDay = firstDate.getDay();
    var monthNames = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec';
    var monthTitle = monthNames.split(' ')[month];
    var safeRoleShopName = roleShopName;

    if (safeRoleShopName == null || safeRoleShopName == '') {
        safeRoleShopName = 'ALL';
    }

    safeRoleShopName = safeRoleShopName.replace(/'/g, '');

    var html = '<div class="calendar-title">';
    html = html + '<button class="calendar-nav-btn" onclick="changeCalendarMonth(\'' + calendarId + '\',\'' + detailsId + '\',\'' + safeRoleShopName + '\',-1)">‹</button>';
    html = html + '<span>' + monthTitle + ' ' + year + '</span>';
    html = html + '<button class="calendar-nav-btn" onclick="changeCalendarMonth(\'' + calendarId + '\',\'' + detailsId + '\',\'' + safeRoleShopName + '\',1)">›</button>';
    html = html + '</div>';
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
        var bookingCount = 0;
        var hoverText = 'No booking';

        for (var i = 0; i < bookings.length; i = i + 1) {
            if (bookings[i].date == dateText) {
                if (safeRoleShopName == 'ALL' || sameMerchantName(bookings[i].merchant, safeRoleShopName)) {
                    bookedClass = ' booked-day';
                    bookingCount = bookingCount + 1;

                    if (hoverText == 'No booking') {
                        hoverText = '';
                    }

                    hoverText = hoverText + cleanDisplayText(bookings[i].customer) + ' - ' + cleanDisplayText(bookings[i].time) + ' | ';
                }
            }
        }

        html = html + '<button class="calendar-day' + bookedClass + '" title="' + hoverText + '" onclick="showCalendarDetails(\'' + safeRoleShopName + '\',\'' + dateText + '\',\'' + detailsId + '\')">';
        html = html + '<span>' + day + '</span>';

        if (bookingCount > 0) {
            html = html + '<small>' + bookingCount + ' booking</small>';
        }

        html = html + '</button>';
    }

    calendarBox.innerHTML = html;
}

function showCalendarDetails(roleShopName, dateValue, detailsId) {
    var detailBox = document.getElementById(detailsId);

    if (detailBox != null) {
        detailBox.innerHTML = '<h3>' + dateValue + '</h3>' + getBookingsForDate(roleShopName, dateValue);
    }
}



function getShopData(shopName) {
    var shops = [
        {name:'Glow Beauty Salon', image:'assets/images/Glow beauty salon.jpeg', available:'Mon - Fri', description:'Glow Beauty Salon is a premium beauty lounge for customers who want a fresh, confident, camera-ready look. The salon focuses on soft glam, healthy skin, neat hair shaping, and calm one-to-one service. Every appointment starts with a short consultation so the stylist can understand the customer\'s skin type, hair condition, event needs, and comfort level.', services:'<div class="service-lux-list"><p><b>Haircut - $20:</b> The stylist checks face shape and hair texture first, then trims, layers, and finishes the hair neatly.</p><p><b>Golden Facial - $65:</b> Skin is cleansed, massaged, masked, and brightened for a smooth glow.</p><p><b>HydraFacial - $90:</b> The face is deeply cleansed and hydrated to refresh dull or tired skin.</p><p><b>Fruit Facial - $55:</b> Gentle fruit-based care is used for a clean, fresh, natural glow.</p><p><b>Anti-Aging Facial - $200:</b> A focused facial for firming, smoothing, and improving skin texture.</p><p><b>Chemical Peel Facial - $150:</b> A careful peel service that helps remove dull surface skin and improves brightness.</p></div>'},
        {name:'Women-Free', image:'assets/images/Women-Free.jpeg', available:'Daily', description:'Women-Free is designed as a comfortable self-care studio where customers can relax, refresh, and feel looked after. The shop focuses on body care, smooth skin, gentle beauty maintenance, and spa-style comfort in a clean and private setting.', services:'<div class="service-lux-list"><p><b>Waxing - $90:</b> Skin is prepared, waxed carefully, then soothed with after-care.</p><p><b>Hair Treatment - $89:</b> Hair is washed, treated, steamed when needed, and finished for a softer feel.</p><p><b>Steam Bath - $110:</b> Warm steam is used to relax the body and open the pores.</p><p><b>Scrub Therapy - $69:</b> The therapist gently exfoliates to remove dry skin and improve smoothness.</p><p><b>Fish Pedicure - $78:</b> Feet are refreshed in a spa-style pedicure experience.</p></div>'},
        {name:'Luxury Spa', image:'assets/images/luxery spa.jpeg', available:'Daily', description:'Luxury Spa gives customers a peaceful escape from stress. The environment is calm, warm, and private, with treatments made for relaxation, muscle comfort, and full-body balance. Therapists adjust pressure based on customer preference.', services:'<div class="service-lux-list"><p><b>Thai Massage - $90:</b> Stretching and pressure techniques help loosen tight muscles.</p><p><b>Ayurvedic Oil Massage - $120:</b> Warm oil is applied slowly to calm the body and improve relaxation.</p><p><b>Swedish Massage - $80:</b> Gentle full-body movements help reduce stress and tiredness.</p><p><b>Aromatherapy Massage - $69:</b> Scented oils are used to create a calming spa experience.</p><p><b>Foot Massage - $55:</b> The therapist focuses on tired feet and pressure points.</p></div>'},
        {name:'Wellness Center', image:'assets/images/wellness center.jpeg', available:'Tue - Sun', description:'Wellness Center is a bright health and movement space for customers who want better balance, energy, posture, and confidence. Sessions are beginner-friendly and guided clearly so customers feel safe and supported.', services:'<div class="service-lux-list"><p><b>Yoga Session - $25:</b> Guided stretching, posture, and breathing for flexibility.</p><p><b>Meditation - $25:</b> Calm breathing and focus practice to relax the mind.</p><p><b>Zumba - $35:</b> A fun dance-fitness session with energetic movement.</p><p><b>Chiropractic - $30:</b> Posture-focused care to support body alignment and comfort.</p></div>'},
        {name:'Make Up Studio', image:'assets/images/make up studio.jpeg', available:'Mon - Fri', description:'Make Up Studio creates polished looks for weddings, parties, photoshoots, and special events. The artist studies the customer\'s outfit, skin tone, event timing, and preferred style before creating the final look.', services:'<div class="service-lux-list"><p><b>Bridal Makeup - $190:</b> A complete wedding look with skin prep, base, eyes, lips, and final setting.</p><p><b>Party Makeup - $188:</b> Glam makeup made to last through the event.</p><p><b>Photoshoot Makeup - $188:</b> Camera-ready makeup with balanced lighting and finish.</p><p><b>Hair Styling - $90:</b> Hair is styled to match the makeup and outfit.</p><p><b>Customized Makeup - $135:</b> A look designed around the customer\'s own preference.</p></div>'},
        {name:'Elite Barber', image:'assets/images/elite barber.jpeg', available:'Tue - Sun', description:'Elite Barber is a sharp grooming space for clean cuts, neat beard work, and confident styling. The barber checks the customer\'s preferred look and gives a clean finish with attention to edges and detail.', services:'<div class="service-lux-list"><p><b>Hair Styling - $25:</b> Hair is shaped, styled, and finished neatly.</p><p><b>Beard Trim - $15:</b> Beard length and edges are cleaned for a sharper look.</p><p><b>Keratin Treatment - $50:</b> Hair is treated to look smoother and easier to manage.</p><p><b>Eyebrow Trim - $15:</b> Brows are lightly cleaned for a neat finish.</p></div>'},
        {name:'Manly Mane Salon', image:'assets/images/Manly Mane Salon.jpeg', available:'Mon - Fri', description:'Manly Mane Salon offers simple, stylish, and reliable grooming for hair, beard, washing, and colour. The service style is quick but careful, making it easy for customers to maintain a neat everyday look.', services:'<div class="service-lux-list"><p><b>Hair Styling - $25:</b> A clean style based on face shape and hair type.</p><p><b>Hair Wash - $10:</b> Hair is washed and refreshed before or after styling.</p><p><b>Beard Trim - $15:</b> Beard is shaped and cleaned for a polished finish.</p><p><b>Hair Dye - $125:</b> Colour is applied carefully for a fresh new look.</p></div>'},
        {name:'Blink Glam', image:'assets/images/Blink Glam.jpeg', available:'Daily', description:'Blink Glam focuses on lashes and eye beauty for customers who want a bright, lifted, soft-glam appearance. Services are handled with careful eye-area hygiene and a gentle consultation before treatment.', services:'<div class="service-lux-list"><p><b>Eyelash Extensions - $90:</b> Lashes are added to create a fuller look.</p><p><b>Eyelash Lift - $77:</b> Natural lashes are lifted for a curled effect.</p><p><b>Under Eye Treatment - $80:</b> Gentle care is applied to refresh tired eyes.</p><p><b>Eye Spa - $58:</b> A relaxing treatment focused on comfort around the eyes.</p><p><b>Eyelash Tint - $45:</b> Lashes are darkened for stronger definition.</p></div>'},
        {name:'Cosmos Tattoo Art', image:'assets/images/Cosmos Tattoo Art.jpeg', available:'Daily', description:'Cosmos Tattoo Art is a creative studio for custom tattoo planning, detailed artwork, touch-ups, and after-care guidance. The artist discusses design size, placement, meaning, and care before starting.', services:'<div class="service-lux-list"><p><b>Colour Tattoo - $99:</b> A colourful tattoo design planned with the customer.</p><p><b>Hand Tattoo - $54:</b> Smaller artwork placed carefully on the hand area.</p><p><b>Chest Tattoo - $80:</b> A larger design placed on the chest area.</p><p><b>Leg Tattoo - $69:</b> Tattoo artwork designed for leg placement.</p><p><b>Sleeve Tattoo - $55:</b> Extended arm artwork planned in sections.</p><p><b>Tattoo Removal - $190:</b> A fading service for old tattoo work.</p><p><b>Tattoo Touch-Up - $67:</b> Existing tattoo lines and colour are refreshed.</p></div>'},
        {name:'The Nail Hub', image:'assets/images/The Nail Hub.jpeg', available:'Tue - Sun', description:'The Nail Hub is a neat and creative nail studio for customers who love clean nail care, glossy finishes, and stylish designs. The nail artist prepares, shapes, paints, and finishes nails carefully for a polished look.', services:'<div class="service-lux-list"><p><b>Nail Art - $20:</b> Custom designs are drawn or added based on the customer\'s style.</p><p><b>Manicure - $15:</b> Hands and nails are cleaned, shaped, and cared for.</p><p><b>Pedicure - $20:</b> Feet and nails are refreshed and polished.</p><p><b>Gel Manicure + Pedicure - $35:</b> Gel polish gives a longer-lasting shine.</p><p><b>Gel Extensions - $35:</b> Gel is used to create extra length.</p><p><b>Nail Extensions - $35:</b> Nails are extended and shaped neatly.</p></div>'}
    ];
    var found = shops[0];

    for (var i = 0; i < shops.length; i = i + 1) {
        if (sameMerchantName(shops[i].name, shopName)) {
            found = shops[i];
        }
    }

    return found;
}

function getShopContactInfo(shopName) {
    var address = '12 Orchard Road, #02-18, Singapore 238823';
    var phone = '+65 6123 4501';
    var email = 'hello@glowbeautysalon.sg';

    if (sameMerchantName(shopName, 'Women-Free')) {
        address = '88 Tanjong Pagar Road, #03-05, Singapore 088509';
        phone = '+65 6123 4502';
        email = 'care@womenfree.sg';
    }
    else if (sameMerchantName(shopName, 'Luxury Spa')) {
        address = '6 Raffles Boulevard, #04-21, Singapore 039594';
        phone = '+65 6123 4503';
        email = 'relax@luxuryspa.sg';
    }
    else if (sameMerchantName(shopName, 'Wellness Center')) {
        address = '301 Serangoon Avenue 2, #02-11, Singapore 550301';
        phone = '+65 6123 4504';
        email = 'hello@wellnesscenter.sg';
    }
    else if (sameMerchantName(shopName, 'Make Up Studio')) {
        address = '15 Scotts Road, #05-09, Singapore 228218';
        phone = '+65 6123 4505';
        email = 'studio@makeupstudio.sg';
    }
    else if (sameMerchantName(shopName, 'Elite Barber')) {
        address = '21 Haji Lane, #01-03, Singapore 189214';
        phone = '+65 6123 4506';
        email = 'book@elitebarber.sg';
    }
    else if (sameMerchantName(shopName, 'Manly Mane Salon')) {
        address = '9 North Bridge Road, #02-14, Singapore 179097';
        phone = '+65 6123 4507';
        email = 'groom@manlymane.sg';
    }
    else if (sameMerchantName(shopName, 'Blink Glam')) {
        address = '1 HarbourFront Walk, #03-22, Singapore 098585';
        phone = '+65 6123 4508';
        email = 'lashes@blinkglam.sg';
    }
    else if (sameMerchantName(shopName, 'Cosmos Tattoo Art')) {
        address = '33 Arab Street, #02-07, Singapore 199732';
        phone = '+65 6123 4509';
        email = 'ink@cosmostattooart.sg';
    }
    else if (sameMerchantName(shopName, 'The Nail Hub')) {
        address = '200 Victoria Street, #04-16, Singapore 188021';
        phone = '+65 6123 4510';
        email = 'nails@thenailhub.sg';
    }

    return '<p><b>Address:</b> ' + address + '</p><p><b>Phone:</b> ' + phone + '</p><p><b>Email:</b> ' + email + '</p>';
}

function getShopKey(shopName) {
    return cleanMerchantName(shopName);
}

function cleanDisplayText(textValue) {
    var cleanText = textValue;

    if (cleanText == null) {
        cleanText = '';
    }

    cleanText = cleanText.replace(/</g, '');
    cleanText = cleanText.replace(/>/g, '');
    cleanText = cleanText.replace(/\|/g, '');

    return cleanText;
}

function getLikedShopsText() {
    var liked = localStorage.getItem('likedShops');

    if (liked == null) {
        liked = '';
    }

    return liked;
}

function isShopLiked(shopName) {
    var liked = getLikedShopsText();
    var key = '|' + getShopKey(shopName) + '|';
    var answer = false;

    if (liked.indexOf(key) != -1) {
        answer = true;
    }

    return answer;
}

function getHeartText(shopName) {
    if (isShopLiked(shopName)) {
        return '♥';
    }

    return '♡';
}

function toggleShopLike(shopName) {
    var liked = getLikedShopsText();
    var key = '|' + getShopKey(shopName) + '|';

    if (liked.indexOf(key) != -1) {
        liked = liked.replace(key, '|');
    }
    else {
        liked = liked + getShopKey(shopName) + '|';

        if (liked.substring(0, 1) != '|') {
            liked = '|' + liked;
        }
    }

    localStorage.setItem('likedShops', liked);
}

function refreshMerchantLikeButtons() {
    var buttons = document.querySelectorAll('.merchant-like-btn, .heart-like-btn');

    for (var i = 0; i < buttons.length; i = i + 1) {
        var card = buttons[i].closest('.merchant-card');

        if (card != null) {
            var title = card.querySelector('h2');

            if (title != null) {
                buttons[i].innerHTML = getHeartText(title.innerText);

                if (isShopLiked(title.innerText)) {
                    buttons[i].classList.add('liked');
                }
                else {
                    buttons[i].classList.remove('liked');
                }
            }
        }
    }
}

function moveLikedShopsToTop() {
    var grid = document.querySelector('.merchant-grid');

    if (grid == null) {
        return;
    }

    var cards = grid.querySelectorAll('.merchant-card');

    for (var i = cards.length - 1; i >= 0; i = i - 1) {
        var title = cards[i].querySelector('h2');

        if (title != null && isShopLiked(title.innerText)) {
            grid.insertBefore(cards[i], grid.firstElementChild);
        }
    }
}

function isShopDeleted(shopName) {
    var deleted = localStorage.getItem('deletedShops');
    var answer = false;

    if (deleted != null && deleted.indexOf('|' + getShopKey(shopName) + '|') != -1) {
        answer = true;
    }

    return answer;
}

function deleteShopFromMerchantPage(shopName) {
    var confirmDelete = confirm('Do you want to delete the shop ' + shopName + '?');

    if (confirmDelete == false) {
        return;
    }

    var deleted = localStorage.getItem('deletedShops');

    if (deleted == null) {
        deleted = '|';
    }

    if (deleted.indexOf('|' + getShopKey(shopName) + '|') == -1) {
        deleted = deleted + getShopKey(shopName) + '|';
    }

    localStorage.setItem('deletedShops', deleted);
    alert(shopName + ' deleted from merchant page.');
    location.reload();
}

function goToShopDetail(shopName) {
    localStorage.setItem('selectedMerchant', shopName);
    window.location.href = 'shop-detail.html?shop=' + encodeURIComponent(shopName);
}

function getSelectedDetailShop() {
    var text = window.location.search;
    var shopName = localStorage.getItem('selectedMerchant');

    if (text.indexOf('shop=') != -1) {
        shopName = decodeURIComponent(text.substring(text.indexOf('shop=') + 5));
    }

    if (shopName == null || shopName == '') {
        shopName = 'Glow Beauty Salon';
    }

    return shopName;
}

function getReviewStars(ratingValue) {
    var stars = '';
    var ratingNumber = Number(ratingValue);

    for (var i = 1; i <= 5; i = i + 1) {
        if (i <= ratingNumber) {
            stars = stars + '★';
        }
        else {
            stars = stars + '☆';
        }
    }

    return stars;
}

function canReplyToReviews(shopName) {
    var role = getCurrentRole();
    var ownerShop = getOwnerShopName();
    var answer = false;

    if (role == 'Merchant Admin') {
        answer = true;
    }
    else if (role == 'Shop Owner' && sameMerchantName(shopName, ownerShop)) {
        answer = true;
    }

    return answer;
}

function renderShopDetailPage() {
    var shopName = getSelectedDetailShop();
    var shop = getShopData(shopName);
    var ownerShop = getOwnerShopName();
    var role = getCurrentRole();

    document.getElementById('detailShopName').innerHTML = shop.name;
    document.getElementById('detailShopImage').src = shop.image;
    document.getElementById('detailShopImage').alt = shop.name;
    document.getElementById('detailDescription').innerHTML = shop.description;
    document.getElementById('detailServices').innerHTML = shop.services;
    document.getElementById('detailAvailable').innerHTML = 'Available: ' + shop.available;
    document.getElementById('detailContactInfo').innerHTML = getShopContactInfo(shop.name);
    document.getElementById('detailLikeBtn').innerHTML = getHeartText(shop.name);

    if (isShopLiked(shop.name)) {
        document.getElementById('detailLikeBtn').classList.add('liked');
    }
    else {
        document.getElementById('detailLikeBtn').classList.remove('liked');
    }

    if (role == 'Shop Owner' && sameMerchantName(shop.name, ownerShop)) {
        document.getElementById('detailOwnerActions').innerHTML = '<button onclick="window.location.href=\'shop-owner-dashboard.html#shopDetails\'">Edit / Update My Shop</button>';
        document.getElementById('shopDetailShell').className = 'shop-detail-shell owner-glow-shop';
    }
    else if (role == 'Merchant Admin') {
        document.getElementById('detailOwnerActions').innerHTML = '<button onclick="deleteShopFromMerchantPage(\'' + shop.name.replace(/'/g, '') + '\')">Delete Shop</button>';
    }
    else {
        document.getElementById('detailOwnerActions').innerHTML = '';
    }

    renderDetailComments(shop.name);
    renderDetailCalendar(shop.name);
    renderShopChat(shop.name);
}

function clickDetailLike() {
    var shopName = getSelectedDetailShop();
    toggleShopLike(shopName);
    document.getElementById('detailLikeBtn').innerHTML = getHeartText(shopName);

    if (isShopLiked(shopName)) {
        document.getElementById('detailLikeBtn').classList.add('liked');
    }
    else {
        document.getElementById('detailLikeBtn').classList.remove('liked');
    }
}

function renderDetailComments(shopName) {
    var key = 'reviews_' + getShopKey(shopName);
    var savedReviews = localStorage.getItem(key);
    var output = '';

    if (savedReviews == null || savedReviews == '') {
        output = '<p class="empty-review-text">No reviews yet. Be the first to review this shop.</p>';
    }
    else {
        var reviews = JSON.parse(savedReviews);

        for (var i = 0; i < reviews.length; i = i + 1) {
            output = output + '<div class="comment-item review-card">';
            output = output + '<div class="review-top-line"><b>' + reviews[i].name + '</b><span class="review-stars">' + getReviewStars(reviews[i].rating) + '</span></div>';
            output = output + '<p>' + reviews[i].text + '</p>';
            output = output + '<button class="tiny-review-btn" onclick="rateDetailReview(' + i + ')">Helpful · ' + reviews[i].helpful + '</button>';

            if (reviews[i].reply != '') {
                output = output + '<div class="owner-reply-box"><b>Owner reply:</b><p>' + reviews[i].reply + '</p></div>';
            }

            if (canReplyToReviews(shopName)) {
                output = output + '<input id="replyInput' + i + '" class="reply-input" type="text" placeholder="Reply to this review">';
                output = output + '<button class="tiny-review-btn" onclick="replyToDetailReview(' + i + ')">Reply</button>';
            }

            output = output + '</div>';
        }
    }

    document.getElementById('commentList').innerHTML = output;
}

function getReviewList(shopName) {
    var key = 'reviews_' + getShopKey(shopName);
    var savedReviews = localStorage.getItem(key);
    var reviews = [];

    if (savedReviews != null && savedReviews != '') {
        reviews = JSON.parse(savedReviews);
    }

    return reviews;
}

function saveReviewList(shopName, reviews) {
    var key = 'reviews_' + getShopKey(shopName);
    localStorage.setItem(key, JSON.stringify(reviews));
}

function addDetailComment() {
    var shopName = getSelectedDetailShop();
    var text = document.getElementById('commentInput').value;
    var nameText = document.getElementById('reviewNameInput').value;
    var ratingText = document.getElementById('reviewRatingInput').value;

    text = cleanDisplayText(text);
    nameText = cleanDisplayText(nameText);

    if (nameText == '') {
        nameText = 'Customer';
    }

    if (text == '') {
        alert('Please type a review first.');
        return;
    }

    var reviews = getReviewList(shopName);
    var review = {name:nameText, rating:ratingText, text:text, helpful:0, reply:''};
    reviews[reviews.length] = review;
    saveReviewList(shopName, reviews);
    document.getElementById('commentInput').value = '';
    renderDetailComments(shopName);
}

function rateDetailReview(reviewNumber) {
    var shopName = getSelectedDetailShop();
    var reviews = getReviewList(shopName);

    if (reviews[reviewNumber] != null) {
        reviews[reviewNumber].helpful = reviews[reviewNumber].helpful + 1;
        saveReviewList(shopName, reviews);
    }

    renderDetailComments(shopName);
}

function replyToDetailReview(reviewNumber) {
    var shopName = getSelectedDetailShop();

    if (canReplyToReviews(shopName) == false) {
        alert('Only the shop owner or merchant can reply.');
        return;
    }

    var inputBox = document.getElementById('replyInput' + reviewNumber);
    var replyText = inputBox.value;
    replyText = cleanDisplayText(replyText);

    if (replyText == '') {
        alert('Please type a reply first.');
        return;
    }

    var reviews = getReviewList(shopName);

    if (reviews[reviewNumber] != null) {
        reviews[reviewNumber].reply = replyText;
        saveReviewList(shopName, reviews);
    }

    renderDetailComments(shopName);
}

function getDetailSlot(slotNumber) {
    if (slotNumber == 1) {
        return '10:00';
    }
    else if (slotNumber == 2) {
        return '11:30';
    }
    else if (slotNumber == 3) {
        return '14:00';
    }

    return '16:30';
}

function countTakenSlotsForDate(shopName, dateValue) {
    var count = 0;

    if (isBookingTimeTaken(shopName, dateValue, getDetailSlot(1))) {
        count = count + 1;
    }
    if (isBookingTimeTaken(shopName, dateValue, getDetailSlot(2))) {
        count = count + 1;
    }
    if (isBookingTimeTaken(shopName, dateValue, getDetailSlot(3))) {
        count = count + 1;
    }
    if (isBookingTimeTaken(shopName, dateValue, getDetailSlot(4))) {
        count = count + 1;
    }

    return count;
}

function renderDetailCalendar(shopName) {
    var box = document.getElementById('detailCalendar');
    var details = document.getElementById('detailCalendarDetails');
    var today = new Date();
    var year = today.getFullYear();
    var month = today.getMonth();
    var firstDate = new Date(year, month, 1);
    var lastDate = new Date(year, month + 1, 0);
    var startDay = firstDate.getDay();
    var monthNames = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec';
    var html = '';

    html = html + '<div class="calendar-title detail-real-calendar-title"><span>' + monthNames.split(' ')[month] + ' ' + year + '</span></div>';
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

        var taken = countTakenSlotsForDate(shopName, dateText);
        var statusClass = ' free-day';
        var statusText = 'Free';

        if (taken >= 4) {
            statusClass = ' full-day';
            statusText = 'Full';
        }
        else if (taken > 0) {
            statusClass = ' some-day';
            statusText = 'Some';
        }

        html = html + '<button class="calendar-day shop-status-day' + statusClass + '" onclick="showDetailCalendarStatus(\'' + shopName.replace(/'/g, '') + '\',\'' + dateText + '\')">';
        html = html + '<span>' + day + '</span><small>' + statusText + '</small>';
        html = html + '</button>';
    }

    box.innerHTML = html;

    if (details != null) {
        details.innerHTML = '<b>Legend:</b> Free dates are open, Some means a few slots are booked, Full means no slots left.';
    }
}

function showDetailCalendarStatus(shopName, dateValue) {
    var details = document.getElementById('detailCalendarDetails');
    var taken = countTakenSlotsForDate(shopName, dateValue);
    var openSlots = 4 - taken;

    if (openSlots < 0) {
        openSlots = 0;
    }

    if (details != null) {
        details.innerHTML = '<h3>' + dateValue + '</h3><p>' + openSlots + ' slot(s) free for this shop.</p><button onclick="pickDetailBookingDate(\'' + shopName.replace(/'/g, '') + '\',\'' + dateValue + '\')">Book this date</button>';
    }
}

function pickDetailBookingDate(shopName, dateValue) {
    localStorage.setItem('selectedMerchant', shopName);
    localStorage.setItem('selectedBookingDate', dateValue);
    window.location.href = 'booking.html';
}

function renderShopChat(shopName) {
    var key = 'chat_' + getShopKey(shopName);
    var chat = localStorage.getItem(key);

    if (chat == null || chat == '') {
        chat = '<div class="ai-msg"><b>Vaniday AI</b><p>Hi! Ask me about services, prices, booking dates, or what this shop is best for.</p></div>';
    }

    document.getElementById('chatMessages').innerHTML = chat;
}

function sendShopChat() {
    var shopName = getSelectedDetailShop();
    var message = document.getElementById('chatInput').value;

    message = cleanDisplayText(message);

    if (message == '') {
        alert('Please type a question first.');
        return;
    }

    var reply = 'Vaniday AI: Thanks for asking. You can review the services, check the calendar, and book a suitable slot from this page.';
    var lower = message.toLowerCase();
    var shop = getShopData(shopName);

    if (lower.indexOf('price') != -1 || lower.indexOf('service') != -1 || lower.indexOf('do') != -1) {
        reply = 'Vaniday AI: ' + shop.name + ' offers the premium services shown on the left. Each service starts with a short consultation so the customer gets the right treatment.';
    }
    else if (lower.indexOf('date') != -1 || lower.indexOf('free') != -1 || lower.indexOf('available') != -1) {
        reply = 'Vaniday AI: The calendar shows Free, Some booked, and Full dates. Tap a date to continue booking.';
    }
    else if (lower.indexOf('book') != -1) {
        reply = 'Vaniday AI: Click Book Now or choose a free calendar date. Then confirm the booking details on the booking page.';
    }
    else if (lower.indexOf('review') != -1 || lower.indexOf('rating') != -1) {
        reply = 'Vaniday AI: You can leave a star rating and review below. The shop owner can reply after logging in.';
    }

    var key = 'chat_' + getShopKey(shopName);
    var chat = localStorage.getItem(key);

    if (chat == null) {
        chat = '';
    }

    chat = chat + '<div class="user-msg"><b>You</b><p>' + message + '</p></div><div class="ai-msg"><b>Vaniday AI</b><p>' + reply + '</p></div>';
    localStorage.setItem(key, chat);
    document.getElementById('chatInput').value = '';
    renderShopChat(shopName);
}
