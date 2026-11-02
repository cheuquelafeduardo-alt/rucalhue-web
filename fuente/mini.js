/* Motor mínimo de plantillas para el sitio de Rucalhue Arquitectura.
   Soporta {{valor}}, <sc-for list as>, <sc-if value>, eventos onClick/onChange/onSubmit y setState. */
(function () {
  'use strict';
  var HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;

  function lookup(expr, scope) {
    expr = expr.trim();
    if (expr === 'true') return true;
    if (expr === 'false') return false;
    var parts = expr.split('.'), v = scope;
    for (var i = 0; i < parts.length; i++) {
      if (v == null) return undefined;
      v = v[parts[i]];
    }
    return v;
  }
  function single(str) { var m = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/.exec(str); return m ? m[1] : null; }
  function interp(str, scope) {
    return str.replace(HOLE, function (_, e) { var v = lookup(e, scope); return v == null ? '' : String(v); });
  }

  var EVENTS = { onclick: 'click', onchange: 'input', onsubmit: 'submit', oninput: 'input' };

  function renderNodes(nodes, scope, out) {
    for (var i = 0; i < nodes.length; i++) renderNode(nodes[i], scope, out);
  }

  function renderNode(n, scope, out) {
    if (n.nodeType === 3) { out.appendChild(document.createTextNode(interp(n.nodeValue, scope))); return; }
    if (n.nodeType !== 1) return;
    var tag = n.localName;
    if (tag === 'sc-for') {
      var list = lookup(single(n.getAttribute('list')) || '', scope) || [];
      var as = n.getAttribute('as') || 'item';
      for (var k = 0; k < list.length; k++) {
        var s = Object.create(scope); s[as] = list[k];
        renderNodes(n.childNodes, s, out);
      }
      return;
    }
    if (tag === 'sc-if') {
      if (lookup(single(n.getAttribute('value')) || '', scope)) renderNodes(n.childNodes, scope, out);
      return;
    }
    var ns = n.namespaceURI;
    var el = ns && ns !== 'http://www.w3.org/1999/xhtml' ? document.createElementNS(ns, n.tagName) : document.createElement(tag);
    var valueProp;
    for (var a = 0; a < n.attributes.length; a++) {
      var at = n.attributes[a], name = at.name, val = at.value;
      if (name.indexOf('hint-') === 0) continue;
      var lname = name.toLowerCase();
      if (EVENTS[lname]) {
        var fn = lookup(single(val) || '', scope);
        if (typeof fn === 'function') {
          var evt = EVENTS[lname];
          if (lname === 'onchange' && (tag === 'select')) evt = 'change';
          el.addEventListener(evt, fn);
        }
        continue;
      }
      if (val.indexOf('{{') < 0) {
        if (at.namespaceURI) el.setAttributeNS(at.namespaceURI, name, val); else el.setAttribute(name, val);
        continue;
      }
      var one = single(val);
      var v = one ? lookup(one, scope) : interp(val, scope);
      if (name === 'value' && (tag === 'input' || tag === 'textarea' || tag === 'select')) { valueProp = v == null ? '' : String(v); continue; }
      if (v === false || v == null) continue;
      if (v === true) v = '';
      if (at.namespaceURI) el.setAttributeNS(at.namespaceURI, name, String(v)); else el.setAttribute(name, String(v));
    }
    var src = tag === 'template' ? n.content : n;
    renderNodes(src.childNodes, scope, el);
    if (valueProp !== undefined) el.value = valueProp;
    out.appendChild(el);
  }

  function DCLogic(props) { this.props = props || {}; this.state = {}; }
  DCLogic.prototype.setState = function (patch) {
    var p = typeof patch === 'function' ? patch(this.state) : patch;
    this.state = Object.assign({}, this.state, p);
    if (this.__render) this.__render();
  };
  DCLogic.prototype.renderVals = function () { return {}; };

  function mount(root, tpl, Component) {
    var comp = new Component({});
    // Marca campos de formulario para restaurar el foco al redibujar
    var fields = tpl.content.querySelectorAll('input,textarea,select');
    for (var i = 0; i < fields.length; i++) fields[i].setAttribute('data-k', 'f' + i);
    // Secciones con contenido dinámico (las demás se dibujan una sola vez)
    var wrap = tpl.content.firstElementChild;
    var dyn = [];
    for (var c = 0; c < wrap.children.length; c++) {
      var ch = wrap.children[c];
      if (ch.outerHTML.indexOf('{{') >= 0 || ch.querySelector('sc-for,sc-if')) dyn.push(c);
    }
    // Si la página viene pre-dibujada, solo se re-dibujan las secciones dinámicas
    var first = !(root.firstElementChild && root.firstElementChild.children.length === wrap.children.length);
    comp.__render = function () {
      var vals = comp.renderVals();
      if (first) {
        var frag = document.createDocumentFragment();
        renderNode(wrap, vals, frag);
        root.innerHTML = '';
        root.appendChild(frag);
        first = false;
        return;
      }
      var active = document.activeElement, key = active && active.getAttribute && active.getAttribute('data-k');
      var selS, selE;
      try { selS = active.selectionStart; selE = active.selectionEnd; } catch (e) {}
      var liveWrap = root.firstElementChild;
      for (var d = 0; d < dyn.length; d++) {
        var f2 = document.createDocumentFragment();
        renderNode(wrap.children[dyn[d]], vals, f2);
        var old = liveWrap.children[dyn[d]];
        liveWrap.replaceChild(f2, old);
      }
      if (key) {
        var nx = root.querySelector('[data-k="' + key + '"]');
        if (nx) { nx.focus({ preventScroll: true }); try { if (selS != null) nx.setSelectionRange(selS, selE); } catch (e) {} }
      }
    };
    comp.__render();
    return comp;
  }

  window.DCLogic = DCLogic;
  window.dcMount = mount;
})();
