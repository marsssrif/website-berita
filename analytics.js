// analytics.js - GA4 / Plausible loader (optional)
(function(){
  const cfg = window.SITE_CONFIG || {};
  const ga = (cfg.GA_MEASUREMENT_ID || "").trim();
  const pl = (cfg.PLAUSIBLE_DOMAIN || "").trim();

  if(ga){
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(ga);
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){ dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", ga);
  }

  if(pl){
    const p = document.createElement("script");
    p.defer = true;
    p.setAttribute("data-domain", pl);
    p.src = "https://plausible.io/js/script.js";
    document.head.appendChild(p);
  }
})();
