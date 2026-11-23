// Necro Survivors - Spotlight Multi-Step Tutorial (modeled after ddong-tem-top TutorialOverlay)
(function () {
  const STORAGE_KEY = "necro_tutorial_seen_v1";
  const STEPS = [
    {
      title: "1. Move & Command the Horde",
      img: "assets/agents/agent_male_nemesis.webp",
      body: "Drag anywhere on screen (virtual joystick) or use WASD / Arrow Keys to dodge incoming waves. Your necromancer attacks and summons minions automatically.",
      hint: "The undead legion marches at your silent command...",
      cta: "Next →",
    },
    {
      title: "2. Harvest Gems & Evolve Skills",
      img: "assets/summons/summon_skeleton_knight.webp",
      body: "Collect glowing EXP gems dropped by slain enemies to level up. Pick 1 of 3 skills or summon upgrades to build unstoppable Tier-2 necromancy synergies.",
      hint: "Every fallen soul fuels your awakening...",
      cta: "Next →",
    },
    {
      title: "3. Conquer 14 Cursed Regions",
      img: "assets/ui/regions/region_1_bg.webp",
      body: "Use your Ultimate skill & Speed toggle during intense waves. Spend loot at the Altar in the Hub to permanently power up and clear all 14 regions & Gates!",
      hint: "Fourteen realms await their Sovereign.",
      cta: "Play!",
    },
  ];

  function injectStyles() {
    if (document.getElementById("necro-tut-style")) return;
    const st = document.createElement("style");
    st.id = "necro-tut-style";
    st.textContent = `
      .necro-tut-help-btn{position:fixed;right:12px;top:12px;z-index:9990;width:34px;height:34px;border-radius:50%;border:2px solid #a855f7;background:rgba(15,10,24,.92);color:#e9d5ff;font-weight:900;font-size:15px;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center}
      .necro-tut-help-btn:hover{background:#2e1065;transform:scale(1.08)}
      .necro-tut-backdrop{position:fixed;inset:0;z-index:9999;background:rgba(8,5,14,.82);display:flex;align-items:center;justify-content:center;padding:16px;animation:nTutFade .16s ease-out}
      .necro-tut-card{width:100%;max-width:340px;background:#161024;border:3px solid #a855f7;border-radius:12px;padding:16px;color:#f5f3ff;box-shadow:0 0 26px rgba(168,85,247,.35),0 8px 28px rgba(0,0,0,.75);animation:nTutFloat 2.4s ease-in-out infinite;font-family:Inter,system-ui,sans-serif}
      .necro-tut-img{width:100%;height:124px;object-fit:contain;border-radius:8px;border:2px solid #3b2460;margin-bottom:10px;image-rendering:pixelated;background:#0d0916}
      .necro-tut-title{font-size:16px;font-weight:900;color:#c084fc;margin:0 0 8px}
      .necro-tut-body{font-size:13px;line-height:1.5;color:#e9d5ff;margin:0 0 8px}
      .necro-tut-hint{font-size:11px;font-style:italic;color:#9ca3af;margin:0 0 12px}
      .necro-tut-footer{display:flex;align-items:center;justify-content:space-between;gap:8px}
      .necro-tut-dots{display:flex;gap:5px}
      .necro-tut-dot{width:8px;height:8px;border-radius:50%;background:#3b2460}
      .necro-tut-dot.active{background:#c084fc}
      .necro-tut-btns{display:flex;gap:6px}
      .necro-tut-btn{padding:7px 12px;border-radius:6px;border:2px solid #4c1d95;background:#24143e;color:#ddd6fe;font-size:12px;font-weight:800;cursor:pointer}
      .necro-tut-btn.primary{background:#a855f7;color:#ffffff;border-color:#d8b4fe}
      @keyframes nTutFade{from{opacity:0}to{opacity:1}}
      @keyframes nTutFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
    `;
    document.head.appendChild(st);
  }

  function openTutorial(startIdx) {
    injectStyles();
    const existing = document.getElementById("necro-tut-backdrop");
    if (existing) existing.remove();
    let idx = startIdx || 0;

    const bd = document.createElement("div");
    bd.id = "necro-tut-backdrop";
    bd.className = "necro-tut-backdrop";
    document.body.appendChild(bd);

    function render() {
      const step = STEPS[idx];
      bd.innerHTML = `
        <div class="necro-tut-card">
          <img class="necro-tut-img" src="${step.img}" onerror="this.style.display='none'" alt="" />
          <h3 class="necro-tut-title">${step.title}</h3>
          <p class="necro-tut-body">${step.body}</p>
          <p class="necro-tut-hint">${step.hint}</p>
          <div class="necro-tut-footer">
            <div class="necro-tut-dots">${STEPS.map((_, i) => `<span class="necro-tut-dot ${i === idx ? "active" : ""}"></span>`).join("")}</div>
            <div class="necro-tut-btns">
              <button class="necro-tut-btn" data-act="skip">Skip</button>
              ${idx > 0 ? `<button class="necro-tut-btn" data-act="prev">Prev</button>` : ""}
              <button class="necro-tut-btn primary" data-act="next">${step.cta}</button>
            </div>
          </div>
        </div>
      `;
      bd.querySelector("[data-act='skip']").onclick = close;
      const prevBtn = bd.querySelector("[data-act='prev']");
      if (prevBtn) prevBtn.onclick = () => { idx--; render(); };
      bd.querySelector("[data-act='next']").onclick = () => {
        if (idx < STEPS.length - 1) { idx++; render(); } else { close(); }
      };
    }

    function close() {
      bd.remove();
      try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    }

    render();
  }

  function init() {
    injectStyles();
    if (!document.getElementById("necro-tut-help-btn")) {
      const btn = document.createElement("button");
      btn.id = "necro-tut-help-btn";
      btn.className = "necro-tut-help-btn";
      btn.title = "How to Play";
      btn.textContent = "?";
      btn.onclick = () => openTutorial(0);
      document.body.appendChild(btn);
    }
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setTimeout(() => openTutorial(0), 600);
      }
    } catch {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
