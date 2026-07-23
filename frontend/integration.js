(function () {
    'use strict';
    var API = '/api';
    var originalSetItem = Storage.prototype.setItem;
    var originalRemoveItem = Storage.prototype.removeItem;
    var syncing = false;
    var sessionKeys = { vanidayToken:true, vanidayUserId:true, vanidayName:true, vanidayRole:true, vanidayEmail:true };
    var structuredKeys = { allBookings:true, vanidayLoyaltyPoints:true };
    var globalExactKeys = { deletedShops:true };
    var globalPrefixes = ['reviews_', 'views_', 'chat_'];

    function originalGet(key) { return Storage.prototype.getItem.call(localStorage, key); }
    function token() { return originalGet('vanidayToken'); }
    function userId() { return originalGet('vanidayUserId'); }
    function authHeaders(json) {
        var h = {}; if (json) h['Content-Type'] = 'application/json';
        if (token()) h.Authorization = 'Bearer ' + token(); return h;
    }
    function isGlobalKey(key) {
        if (globalExactKeys[key]) return true;
        for (var i=0;i<globalPrefixes.length;i++) if (key.indexOf(globalPrefixes[i])===0) return true;
        return false;
    }
    function endpointFor(key) {
        if (structuredKeys[key]) return null;
        if (isGlobalKey(key)) return API + '/state/global';
        var id=userId(); return id ? API + '/state/user/' + encodeURIComponent(id) : null;
    }
    function sendPatch(key,value) {
        if (syncing || sessionKeys[key]) return;
        var endpoint=endpointFor(key); if(!endpoint) return;
        fetch(endpoint,{method:'PATCH',headers:authHeaders(true),body:JSON.stringify({key:key,value:value})}).catch(function(){});
    }
    function sendDelete(key) {
        if (syncing || sessionKeys[key]) return;
        var endpoint=endpointFor(key); if(!endpoint) return;
        fetch(endpoint+'/'+encodeURIComponent(key),{method:'DELETE',headers:authHeaders(false)}).catch(function(){});
    }
    Storage.prototype.setItem=function(key,value){ originalSetItem.call(this,key,value); if(this===localStorage) sendPatch(String(key),String(value)); };
    Storage.prototype.removeItem=function(key){ originalRemoveItem.call(this,key); if(this===localStorage) sendDelete(String(key)); };

    async function getJson(url) {
        try { var r=await fetch(url,{headers:authHeaders(false)}); if(!r.ok) return null; return await r.json(); } catch(e){ return null; }
    }
    function applyValues(values) {
        if(!values||typeof values!=='object') return; syncing=true;
        Object.keys(values).forEach(function(key){ if(!sessionKeys[key]&&!structuredKeys[key]&&values[key]!=null) originalSetItem.call(localStorage,key,String(values[key])); });
        syncing=false;
    }
    async function hydrate() {
        var global=await getJson(API+'/state/global'); if(global) applyValues(global.values);
        var id=userId(); if(id&&token()){ var own=await getJson(API+'/state/user/'+encodeURIComponent(id)); if(own) applyValues(own.values); }
        if(token()) {
            var points=await getJson(API+'/users/me/points');
            if(points && typeof points.loyaltyPoints!=='undefined') originalSetItem.call(localStorage,'vanidayLoyaltyPoints',String(points.loyaltyPoints));
            var bookings=await getJson(API+'/bookings');
            if(Array.isArray(bookings)) originalSetItem.call(localStorage,'allBookings',JSON.stringify(bookings.map(window.VanidayApi ? window.VanidayApi.toLegacyBooking : function(b){return b;})));
        }
    }
    window.VanidayApi = {
        headers: authHeaders,
        request: async function(url,options){ options=options||{}; options.headers=Object.assign({},authHeaders(!!options.body),options.headers||{}); var r=await fetch(url,options); var data=await r.json().catch(function(){return {};}); if(!r.ok) throw new Error(data.message||'Request failed.'); return data; },
        toLegacyBooking:function(b){ return { _id:b._id, customerId:b.customerId, customer:b.customerName||b.customer, customerEmail:b.customerEmail, merchant:b.merchant, service:b.service, date:b.bookingDate||b.date, time:b.bookingTime||b.time, amount:b.amount, reward:b.reward, loyaltyAwarded:b.loyaltyAwarded, status:b.status }; }
    };
    window.VanidaySync={hydrate:hydrate,importCurrentUserState:async function(){var id=userId();if(!id||!token())return;var values={};for(var i=0;i<localStorage.length;i++){var key=localStorage.key(i);if(!sessionKeys[key]&&!structuredKeys[key]&&!isGlobalKey(key))values[key]=originalGet(key);}return fetch(API+'/state/user/'+encodeURIComponent(id)+'/import',{method:'POST',headers:authHeaders(true),body:JSON.stringify({values:values})});},saveNow:function(key){var value=originalGet(key);if(value!==null)sendPatch(key,value);}};
    hydrate();
})();
