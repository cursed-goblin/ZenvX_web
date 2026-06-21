(function () {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ZenvX AI Studio",
    "url": "https://zenvx.in",
    "logo": "https://zenvx.in/assets/images/og-image.png",
    "description": "ZenvX AI Studio builds AI, operating systems, and intelligent agents.",
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "telephone": "+91-9495029709",
        "contactType": "founder",
        "name": "Abhinav T S",
        "email": "abhi@zenvx.in"
      },
      {
        "@type": "ContactPoint",
        "telephone": "+91-7591927789",
        "contactType": "founder",
        "name": "Srihari Kalesh",
        "email": "sk@zenvx.in"
      }
    ],
    "sameAs": [
      "https://github.com/cursed-goblin/zenvx-os"
    ]
  };

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.text = JSON.stringify(schema);
  document.head.appendChild(script);
})();
