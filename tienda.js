/*
 * Merengue · tienda: carrito lateral, pedido con pago SIMULADO y cuenta SIMULADA.
 * Adaptado de las muestras del Catálogo a la medida (carrito en el navegador + recorrido: datos → entrega → pago → confirmación).
 * No se cobra nada ni se envía nada: en una tienda real, el pago lo procesa la pasarela del cliente (Mercado Pago, Niubiz u otra)
 * y al vendedor le llega el pedido por correo. La cuenta y los pedidos guardados viven solo en este navegador.
 * Depende de window.Merengue, que publica el script de la ficha (index.html).
 */
(function (w) {
  'use strict';
  var M = w.Merengue, $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var ENVIO = 8, GRATIS_DESDE = 150;                                   // delivery de ejemplo: S/ 8, gratis desde S/ 150
  var K_CARRITO = 'merengue-carrito', K_CUENTA = 'merengue-cuenta', K_PEDIDOS = 'merengue-pedidos';
  var WA_PATH = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z';
  var WA_ICONO = '<span class="boton-wa__icono"><svg width="21" height="21" viewBox="0 0 24 24" fill="#FFFFFF" aria-hidden="true"><path d="' + WA_PATH + '"/></svg></span>';
  var X_SVG = '<svg width="16" height="16" fill="none" stroke="#2B2222" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13"/></svg>';
  var CARRITO_SVG = '<svg width="52" height="52" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><use href="#i-carrito"/></svg>';

  /* ---------- utilidades ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function dinero(n) { return 'S/ ' + Number(n).toLocaleString('es-PE', { maximumFractionDigits: 2 }); }
  function leer(k, def) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? def : v; } catch (e) { return def; } }
  function escribir(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento: todo vive solo mientras la página está abierta */ } }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function isoDe(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function aFecha(iso) { var p = iso.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function etiqueta(iso) { return M.etiquetaFecha(aFecha(iso)); }

  /* ---------- carrito (se guarda en el navegador) ---------- */
  var lineas = (leer(K_CARRITO, []) || []).filter(function (l) { return l && M.TORTAS[l.i] && M.TORTAS[l.i].pres[l.p] && l.cant > 0 && String(l.f) >= isoDe(new Date()); });
  function llave(l) { return l.i + '|' + l.p + '|' + l.f; }
  function guardar() { escribir(K_CARRITO, lineas); pintarCarrito(); }
  function cantidad() { return lineas.reduce(function (s, l) { return s + l.cant; }, 0); }
  function precioUnit(l) { return M.TORTAS[l.i].pres[l.p][2]; }
  function subtotal() { return lineas.reduce(function (s, l) { return s + l.cant * precioUnit(l); }, 0); }
  function agregar(n) {
    var ex = lineas.filter(function (l) { return llave(l) === llave(n); })[0];
    if (ex) ex.cant = Math.min(9, ex.cant + n.cant); else lineas.push(n);
    guardar();
  }
  function cambiar(k, delta) { lineas.forEach(function (l) { if (llave(l) === k) l.cant = Math.max(0, Math.min(9, l.cant + delta)); }); lineas = lineas.filter(function (l) { return l.cant > 0; }); guardar(); }
  function quitar(k) { lineas = lineas.filter(function (l) { return llave(l) !== k; }); guardar(); }
  function detalleLinea(l) { var p = M.TORTAS[l.i].pres[l.p]; return p[0] + ' · ' + p[1]; }

  function mensajeWa() {
    var t = 'Hola Merengue, quiero hacer este pedido:\n' + lineas.map(function (l) {
      return '• ' + M.nombre(l.i) + ' - ' + detalleLinea(l).replace(' · ', ' (') + ') x' + l.cant + ', para el ' + etiqueta(l.f) + ' - ' + dinero(l.cant * precioUnit(l));
    }).join('\n') + '\nSubtotal: ' + dinero(subtotal()) + '. ¿Me confirman disponibilidad y la entrega?';
    return 'https://wa.me/' + M.whatsapp + '?text=' + encodeURIComponent(t);
  }

  /* ---------- carrito lateral ---------- */
  var velo = document.createElement('div'); velo.className = 'velo';
  var cajon = document.createElement('aside'); cajon.className = 'cajon'; cajon.setAttribute('aria-label', 'Carrito de compras'); cajon.setAttribute('aria-hidden', 'true');
  cajon.innerHTML = '<div class="cajon__cab"><h3>Tu carrito</h3><button class="cajon__x" type="button" id="cerrar-carrito" aria-label="Cerrar carrito">×</button></div><div class="cajon__lista" id="lista-carrito"></div><div class="cajon__pie" id="pie-carrito"></div>';
  document.body.appendChild(velo); document.body.appendChild(cajon);

  function abrirCarrito() { velo.classList.add('on'); cajon.classList.add('on'); cajon.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; $('#cerrar-carrito').focus(); }
  function cerrarCarrito() { velo.classList.remove('on'); cajon.classList.remove('on'); cajon.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }

  function pintarCarrito() {
    var n = cantidad(), badge = $('.carrito__badge'), boton = $('.carrito');
    badge.textContent = n || ''; boton.setAttribute('aria-label', n ? 'Carrito, ' + n + (n === 1 ? ' producto' : ' productos') : 'Carrito, vacío');
    var lista = $('#lista-carrito'), pie = $('#pie-carrito');
    if (!lineas.length) {
      lista.innerHTML = '<div class="cajon__vacio">' + CARRITO_SVG + '<p>Tu carrito está vacío.</p><p class="cajon__vacio-sub">Elige una torta, su tamaño y para cuándo la quieres.</p></div>';
      pie.innerHTML = '<button class="boton-borde btn-bloque" type="button" id="seguir">Seguir viendo tortas</button>'; return;
    }
    lista.innerHTML = lineas.map(function (l) {
      var k = esc(llave(l));
      return '<div class="linea"><div class="linea__foto"><img src="' + esc(M.foto(l.i)) + '" alt=""></div><div><div class="linea__nombre">' + esc(M.nombre(l.i)) + '</div><div class="linea__var">' + esc(detalleLinea(l)) + '</div><div class="linea__fecha">Para el ' + esc(etiqueta(l.f)) + '</div>' +
        '<div class="cant"><button type="button" data-acc="menos" data-k="' + k + '" aria-label="Quitar una">−</button><span>' + l.cant + '</span><button type="button" data-acc="mas" data-k="' + k + '" aria-label="Agregar una">+</button></div></div>' +
        '<div><div class="linea__precio">' + dinero(l.cant * precioUnit(l)) + '</div><button class="linea__quitar" type="button" data-acc="quitar" data-k="' + k + '">Quitar</button></div></div>';
    }).join('');
    pie.innerHTML = '<div class="sub"><span>Subtotal</span><strong>' + dinero(subtotal()) + '</strong></div><p class="nota">El delivery se calcula al hacer el pedido.</p>' +
      '<button class="boton btn-bloque" type="button" id="ir-pedido">Hacer mi pedido</button>' +
      '<div class="cajon__wa"><a class="boton-wa" href="' + mensajeWa() + '" target="_blank" rel="noopener">' + WA_ICONO + '<span>Enviar este pedido por WhatsApp</span></a></div>' +
      (cuenta ? '' : '<p class="nota cajon__cuenta">¿Tienes cuenta? <button class="enlace" type="button" id="cajon-ingresar">Ingresa</button> y usamos tus datos guardados.</p>');
  }
  cajon.addEventListener('click', function (e) {
    var b = e.target.closest('[data-acc]');
    if (b) { var k = b.getAttribute('data-k'), a = b.getAttribute('data-acc'); if (a === 'mas') cambiar(k, 1); else if (a === 'menos') cambiar(k, -1); else quitar(k); return; }
    if (e.target.closest('#seguir')) { cerrarCarrito(); location.hash = '#catalogo'; return; }
    if (e.target.closest('#ir-pedido')) { cerrarCarrito(); abrirPedido(); return; }
    if (e.target.closest('#cajon-ingresar')) { cerrarCarrito(); abrirCuenta(); }
  });
  velo.addEventListener('click', cerrarCarrito);
  $('#cerrar-carrito').addEventListener('click', cerrarCarrito);
  $('.carrito').addEventListener('click', abrirCarrito);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && cajon.classList.contains('on')) cerrarCarrito(); });

  /* ---------- cuenta (simulada) ---------- */
  var cuenta = leer(K_CUENTA, null);
  function nombrePila() { return cuenta ? cuenta.nombre.split(' ')[0] : ''; }
  function pintarEntrada() { var a = $('#ingresar'); if (a) a.textContent = cuenta ? 'Hola, ' + nombrePila() : 'Ingresar'; }
  var dlgCuenta = document.createElement('dialog'); dlgCuenta.className = 'modal modal--chico'; dlgCuenta.id = 'cuenta'; dlgCuenta.setAttribute('aria-label', 'Tu cuenta');
  dlgCuenta.innerHTML = '<div class="modal__caja"><button class="boton-circulo modal__cerrar" type="button" id="cuenta-x" aria-label="Cerrar">' + X_SVG + '</button><div class="cuenta" id="cuenta-raiz"></div></div>';
  document.body.appendChild(dlgCuenta);

  function pintarCuenta() {
    var raiz = $('#cuenta-raiz');
    if (!cuenta) {
      raiz.innerHTML = '<span class="eyebrow">Tu cuenta</span><h2 class="modal__titulo">Ingresa a Merengue</h2><p class="nota">Con tu cuenta guardamos tus datos y tus pedidos para que pedir sea más rápido. También puedes comprar sin cuenta.</p>' +
        '<button class="boton-borde btn-bloque" type="button" id="google"><span class="g">G</span> Continuar con Google</button><div class="o"><span>o con tu correo</span></div>' +
        '<form id="form-cuenta" novalidate><div class="tcampo"><label for="cu-co">Correo</label><input id="cu-co" type="email" autocomplete="email" placeholder="nombre@correo.com"></div><div class="tcampo"><label for="cu-pw">Contraseña</label><input id="cu-pw" type="password" autocomplete="current-password"></div>' +
        '<p class="aviso-opc" id="cu-err" role="alert"></p><button class="boton btn-bloque" type="submit">Ingresar</button></form><p class="simulado">Ingreso simulado para la demostración: puedes usar cualquier correo y contraseña. En la tienda real se conecta con Google o con correo.</p>';
      return;
    }
    var ps = leer(K_PEDIDOS, []);
    raiz.innerHTML = '<span class="eyebrow">Tu cuenta</span><h2 class="modal__titulo">Hola, ' + esc(nombrePila()) + '</h2><p class="nota">' + esc(cuenta.correo) + '</p>' +
      '<h3 class="cuenta__sub">Mis pedidos</h3>' + (ps.length ? '<div class="cuenta__lista">' + ps.map(function (p) { return '<div class="cuenta__pedido"><div><strong>' + esc(p.n) + '</strong><small>' + esc(p.resumen) + '</small></div><b>' + dinero(p.total) + '</b></div>'; }).join('') + '</div>' : '<p class="nota">Aún no tienes pedidos en este navegador.</p>') +
      '<p class="nota">Tus datos se usan para completar el pedido más rápido.</p><button class="boton-borde btn-bloque" type="button" id="salir">Cerrar sesión</button>';
  }
  function abrirCuenta() { pintarCuenta(); if (!dlgCuenta.open) dlgCuenta.showModal(); }
  function iniciar(nombre, correo) { cuenta = { nombre: nombre, correo: correo }; escribir(K_CUENTA, cuenta); pintarEntrada(); pintarCuenta(); pintarCarrito(); prellenar(); }
  dlgCuenta.addEventListener('click', function (e) {
    if (e.target === dlgCuenta || e.target.closest('#cuenta-x')) { dlgCuenta.close(); return; }
    if (e.target.closest('#google')) { iniciar('Lucía Mendoza', 'lucia.mendoza@gmail.com'); return; }
    if (e.target.closest('#salir')) { cuenta = null; try { localStorage.removeItem(K_CUENTA); } catch (x) { /* nada */ } pintarEntrada(); pintarCuenta(); pintarCarrito(); }
  });
  dlgCuenta.addEventListener('submit', function (e) {
    e.preventDefault();
    var co = $('#cu-co').value.trim(), pw = $('#cu-pw').value;
    if (!/^\S+@\S+\.\S+$/.test(co) || !pw) { $('#cu-err').textContent = 'Escribe un correo válido y una contraseña.'; return; }
    var base = co.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    iniciar(base, co);
  });
  var entrar = $('#ingresar'); if (entrar) entrar.addEventListener('click', function (e) { e.preventDefault(); abrirCuenta(); });

  /* ---------- pedido (pago simulado) ---------- */
  var dlgPedido = document.createElement('dialog'); dlgPedido.className = 'modal'; dlgPedido.id = 'pedido'; dlgPedido.setAttribute('aria-label', 'Hacer pedido');
  dlgPedido.innerHTML = '<div class="modal__caja" id="pedido-raiz"></div>';
  document.body.appendChild(dlgPedido);
  var P = { entrega: 'recojo', medio: 'tarjeta' };

  function envio() { return P.entrega === 'delivery' && subtotal() < GRATIS_DESDE ? ENVIO : 0; }
  function camposPago() {
    if (P.medio === 'tarjeta') return '<div class="tcampos"><div class="tcampo tancho"><label for="tn">Número de tarjeta</label><input id="tn" inputmode="numeric" placeholder="4111 1111 1111 1111" autocomplete="off"></div><div class="tcampo"><label for="tv">Vencimiento</label><input id="tv" placeholder="MM/AA" autocomplete="off"></div><div class="tcampo"><label for="tc">Código (CVV)</label><input id="tc" inputmode="numeric" placeholder="123" autocomplete="off"></div></div>';
    if (P.medio === 'yape') return '<div class="tcampos"><div class="tcampo"><label for="yc">Celular de tu Yape</label><input id="yc" inputmode="numeric" placeholder="9XX XXX XXX"></div><div class="tcampo"><label for="yk">Código de aprobación</label><input id="yk" inputmode="numeric" placeholder="6 dígitos de tu app"></div></div><p class="nota">Abre tu app de Yape, copia el código de aprobación y pégalo aquí.</p>';
    return '<p class="nota">Al pagar con Plin te mostraremos la ventana de tu banco para aprobar el pago desde tu app.</p>';
  }
  function camposEntrega() {
    return P.entrega === 'delivery'
      ? '<div class="tcampos"><div class="tcampo"><label for="pdi">Distrito</label><input id="pdi" autocomplete="address-level2"></div><div class="tcampo tancho"><label for="pdr">Dirección y referencia</label><input id="pdr" autocomplete="street-address"></div></div>'
      : '<p class="nota">Recoges tu torta en la tienda, en la fecha y el horario que elegiste. Sin costo.</p>';
  }
  function resumenLineas() {
    return lineas.map(function (l) {
      return '<div class="linea"><div class="linea__foto"><img src="' + esc(M.foto(l.i)) + '" alt=""></div><div><div class="linea__nombre">' + esc(M.nombre(l.i)) + '</div><div class="linea__var">' + esc(detalleLinea(l)) + ' · x' + l.cant + '</div><div class="linea__fecha">Para el ' + esc(etiqueta(l.f)) + '</div></div><div class="linea__precio">' + dinero(l.cant * precioUnit(l)) + '</div></div>';
    }).join('');
  }
  function totales() {
    var sub = subtotal(), env = envio();
    $('#pedido-totales').innerHTML = '<div class="fila-total"><span>Subtotal</span><span>' + dinero(sub) + '</span></div><div class="fila-total"><span>' + (P.entrega === 'delivery' ? 'Delivery' : 'Recojo en tienda') + '</span><span>' + (env ? dinero(env) : 'Gratis') + '</span></div><div class="fila-total grande"><span>Total</span><span>' + dinero(sub + env) + '</span></div>';
    $('#pagar').textContent = 'Pagar ' + dinero(sub + env);
  }
  function abrirPedido() {
    if (!lineas.length) { abrirCarrito(); return; }
    P = { entrega: 'recojo', medio: 'tarjeta' };
    $('#pedido-raiz').innerHTML = '<button class="boton-circulo modal__cerrar" type="button" id="pedido-x" aria-label="Cerrar">' + X_SVG + '</button><div class="pedido"><div class="pedido__form">' +
      '<span class="eyebrow">Tu pedido</span><h2 class="modal__titulo">Finalizar pedido</h2><p class="nota">Compra segura: pagas aquí mismo, sin salir de la página.</p>' +
      '<div class="bloque"><h3>1 · Tus datos</h3><div class="tcampos"><div class="tcampo"><label for="pnm">Nombre completo</label><input id="pnm" autocomplete="name"></div><div class="tcampo"><label for="pce">Celular</label><input id="pce" inputmode="numeric" autocomplete="tel"></div><div class="tcampo tancho"><label for="pco">Correo</label><input id="pco" type="email" autocomplete="email"></div></div>' +
      '<p class="nota" id="aviso-cuenta"></p></div>' +
      '<div class="bloque"><h3>2 · Entrega</h3><div class="medios-pago medios-pago--2" role="radiogroup" aria-label="Tipo de entrega">' +
      [['recojo', 'Recojo en tienda', 'Gratis'], ['delivery', 'Delivery', dinero(ENVIO) + ' · gratis desde ' + dinero(GRATIS_DESDE)]].map(function (m) { return '<button class="medio' + (P.entrega === m[0] ? ' on' : '') + '" type="button" role="radio" aria-checked="' + (P.entrega === m[0]) + '" data-entrega="' + m[0] + '">' + m[1] + '<small>' + m[2] + '</small></button>'; }).join('') +
      '</div><div class="bloque__campos" id="campos-entrega">' + camposEntrega() + '</div><div class="tcampo bloque__campos"><label for="phr">Horario</label><select id="phr"><option>9:00 – 12:00</option><option>12:00 – 15:00</option><option>15:00 – 18:00</option></select></div></div>' +
      '<div class="bloque"><h3>3 · Medio de pago</h3><div class="medios-pago" role="radiogroup" aria-label="Medio de pago">' +
      [['tarjeta', 'Tarjeta', 'Visa, Mastercard…'], ['yape', 'Yape', 'Con tu celular'], ['plin', 'Plin', 'Desde tu banco']].map(function (m) { return '<button class="medio' + (P.medio === m[0] ? ' on' : '') + '" type="button" role="radio" aria-checked="' + (P.medio === m[0]) + '" data-medio="' + m[0] + '">' + m[1] + '<small>' + m[2] + '</small></button>'; }).join('') +
      '</div><div class="bloque__campos" id="campos-pago">' + camposPago() + '</div></div>' +
      '<p class="simulado">Pago simulado para la demostración: no se cobra nada. En la tienda real este paso lo procesa la pasarela de pago y el vendedor recibe el pedido por correo.</p><p class="aviso-opc" id="pedido-err" role="alert"></p></div>' +
      '<aside class="pedido__resumen"><h3>Resumen</h3>' + resumenLineas() + '<div id="pedido-totales"></div><button class="boton btn-bloque" type="button" id="pagar"></button><button class="enlace" type="button" id="pedido-volver">Volver al carrito</button></aside></div>';
    totales(); prellenar();
    if (!dlgPedido.open) dlgPedido.showModal();
  }
  function prellenar() {
    var a = $('#aviso-cuenta'); if (!a) return;
    if (cuenta) {
      if (!$('#pnm').value) $('#pnm').value = cuenta.nombre; if (!$('#pco').value) $('#pco').value = cuenta.correo;
      a.innerHTML = 'Datos de tu cuenta (' + esc(cuenta.correo) + ').';
    } else a.innerHTML = '¿Ya tienes cuenta? <button class="enlace" type="button" id="pedido-ingresar">Ingresa</button> y usamos tus datos guardados. También puedes comprar sin cuenta.';
  }
  dlgPedido.addEventListener('click', function (e) {
    if (e.target === dlgPedido || e.target.closest('#pedido-x')) { dlgPedido.close(); return; }
    if (e.target.closest('#pedido-volver')) { dlgPedido.close(); abrirCarrito(); return; }
    if (e.target.closest('#pedido-ingresar')) { abrirCuenta(); return; }
    var en = e.target.closest('[data-entrega]');
    if (en) { P.entrega = en.getAttribute('data-entrega'); $$('[data-entrega]').forEach(function (b) { var on = b === en; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); }); $('#campos-entrega').innerHTML = camposEntrega(); totales(); return; }
    var me = e.target.closest('[data-medio]');
    if (me) { P.medio = me.getAttribute('data-medio'); $$('[data-medio]').forEach(function (b) { var on = b === me; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); }); $('#campos-pago').innerHTML = camposPago(); return; }
    if (e.target.closest('#pagar')) pagar();
    if (e.target.closest('#pedido-listo')) { dlgPedido.close(); location.hash = '#catalogo'; }
  });
  function pagar() {
    var ids = ['pnm', 'pce', 'pco'].concat(P.entrega === 'delivery' ? ['pdi', 'pdr'] : []);
    var ok = ids.every(function (id) { var v = $('#' + id).value.trim(); $('#' + id).style.borderColor = v ? '' : 'var(--coral)'; return v; });
    if (ok && !/^\S+@\S+\.\S+$/.test($('#pco').value.trim())) { $('#pco').style.borderColor = 'var(--coral)'; ok = false; }
    if (!ok) { $('#pedido-err').textContent = 'Completa tus datos y la dirección de entrega para continuar.'; return; }
    var n = 'ME-' + String(Math.floor(1000 + Math.random() * 8999)), nombre = $('#pnm').value.trim().split(' ')[0], sub = subtotal(), total = sub + envio(), entrega = P.entrega, horario = $('#phr').value;
    var det = lineas.map(function (l) { return '<li><span>' + esc(M.nombre(l.i)) + ' · ' + esc(M.TORTAS[l.i].pres[l.p][0]) + ' x' + l.cant + '</span><small>Para el ' + esc(etiqueta(l.f)) + '</small></li>'; }).join('');
    var ps = leer(K_PEDIDOS, []); ps.unshift({ n: n, total: total, resumen: lineas.map(function (l) { return M.nombre(l.i) + ' x' + l.cant; }).join(', ') }); escribir(K_PEDIDOS, ps.slice(0, 10));
    lineas = []; guardar();
    $('#pedido-raiz').innerHTML = '<button class="boton-circulo modal__cerrar" type="button" id="pedido-x" aria-label="Cerrar">' + X_SVG + '</button><div class="gracias"><div class="ok">✓</div><h2>¡Gracias por tu pedido, ' + esc(nombre) + '!</h2>' +
      '<p>Tu pedido <b>' + n + '</b> fue recibido. Te escribiremos al correo y al celular que indicaste para confirmar los detalles.</p>' +
      '<ul class="gracias__lista">' + det + '</ul><p class="gracias__entrega">' + (entrega === 'delivery' ? 'Delivery' : 'Recojo en tienda') + ' · ' + esc(horario) + ' · Total ' + dinero(total) + '</p>' +
      '<div class="simulado">Esto fue una simulación. En la tienda real: el pago se procesa con la pasarela del cliente y al vendedor le llega un correo con este pedido (tortas, tamaños, fechas, datos de entrega y el monto de ' + dinero(total) + ') para que lo prepare.</div>' +
      '<button class="boton" type="button" id="pedido-listo">Seguir viendo tortas</button></div>';
  }

  pintarEntrada(); pintarCarrito();
  w.Tienda = { agregar: agregar, abrirCarrito: abrirCarrito };
})(window);
