const searchInput = document.getElementById('search-input');
const searchForm = document.getElementById('search-form');
const spriteContainer = document.getElementById('sprite-container');
const pokemonID = document.getElementById('pokemon-id');
const pokemonName = document.getElementById('pokemon-name');
const types = document.getElementById('types');
const weight = document.getElementById('pokemon-weight');
const height = document.getElementById('pokemon-height');
const hp = document.getElementById('base-hp');
const attack = document.getElementById('base-attack');
const defense = document.getElementById('base-defense');
const specialAttack = document.getElementById('base-special-attack');
const specialDefense = document.getElementById('base-special-defense');
const speed = document.getElementById('base-speed');
const abilitiesDiv = document.getElementById('abilities');
const statsDiv = document.getElementById('stats');
const hero = document.getElementById('hero');
const heroTypes = document.getElementById('hero-types');
const galleryPrev = document.getElementById('gallery-prev');
const galleryNext = document.getElementById('gallery-next');
const galleryTrack = document.getElementById('gallery-track');

let gallerySprites = [];
let galleryIndex = 0;
let statsChart = null;
let allPokemon = [];
let suggestionIndex = -1;
const suggestionsDropdown = document.getElementById('suggestions-dropdown');
const suggestionsList = document.getElementById('suggestions-list');
const evolutionsSection = document.getElementById('evolutions-section');
const evolutionsChain = document.getElementById('evolutions-chain');
const descriptionSection = document.getElementById('description-section');
const pokemonDescription = document.getElementById('pokemon-description');

const fetchAllPokemon = async () => {
  try {
    const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1000');
    const data = await res.json();
    allPokemon = data.results.map(p => p.name);
  } catch (e) {
    console.error('Failed to fetch Pokémon list:', e);
  }
};

const showSuggestions = (query) => {
  if (!query.trim()) {
    suggestionsDropdown.style.display = 'none';
    return;
  }
  const matches = allPokemon.filter(p => p.toLowerCase().startsWith(query.toLowerCase())).slice(0, 8);
  if (!matches.length) {
    suggestionsDropdown.style.display = 'none';
    return;
  }
  suggestionsList.innerHTML = matches.map((m, i) => `<li data-index="${i}">${m.charAt(0).toUpperCase() + m.slice(1)}</li>`).join('');
  suggestionsDropdown.style.display = 'block';
  suggestionIndex = -1;
};

const selectSuggestion = (name) => {
  searchInput.value = name;
  suggestionsDropdown.style.display = 'none';
  getPokemon();
};

fetchAllPokemon();

const typeGradients = {
    fire: ['#ff9a9e', '#fecf71'],
    water: ['#a2d2ff', '#42a1ff'],
    grass: ['#b5f0a1', '#78cc55'],
    electric: ['#fff1a8', '#fecc33'],
    psychic: ['#ffd1f0', '#ff66a3'],
    rock: ['#d6c5a1', '#baaa66'],
    ground: ['#f3e6c3', '#dfba52'],
    ice: ['#d7f7ff', '#66ccfe'],
    dragon: ['#cbd7ff', '#7a6cff'],
    fairy: ['#ffe0ff', '#ed99ed'],
    bug: ['#eaf7c7', '#aabb23'],
    ghost: ['#e6e1ff', '#9995d0'],
    steel: ['#e6eef7', '#abaabb'],
    poison: ['#f0d9f3', '#c68bb7'],
    flying: ['#e8ecff', '#8899ff'],
    fighting: ['#f6ddd6', '#d3887e'],
    normal: ['#f7f7f5', '#b7b7aa']
};

const getEvolutionMethod = (details) => {
    if (details.min_level) return `Level ${details.min_level}`;
    if (details.item) return `Use ${details.item.name}`;
    if (details.trigger && details.trigger.name === 'trade') return `Trade`;
    if (details.known_move) return `Knows ${details.known_move.name}`;
    if (details.min_happiness) return `High Friendship`;
    return 'Special condition';
};

const displayEvolutionChain = async (chain) => {
    const addEvolution = async (node) => {
        // Fetch Pokémon data to get the correct sprite
        let spriteUrl = '';
        try {
            const pokemonRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${node.species.name}`);
            if (pokemonRes.ok) {
                const pokemonData = await pokemonRes.json();
                spriteUrl = pokemonData.sprites.front_default || pokemonData.sprites.other?.['official-artwork']?.front_default || '';
            }
        } catch (e) {
            console.error(`Failed to fetch sprite for ${node.species.name}:`, e);
        }
        
        let html = `<div class="evolution-item">
            ${spriteUrl ? `<img src="${spriteUrl}" alt="${node.species.name}" />` : '<div style="width:100px;height:100px;background:rgba(255,255,255,0.05);border-radius:6px"></div>'}
            <div class="evo-name">${node.species.name}</div>`;
        
        if (node.evolution_details && node.evolution_details.length > 0) {
            node.evolution_details.forEach(details => {
                const method = getEvolutionMethod(details);
                html += `<div class="evo-method">${method}</div>`;
            });
        }
        html += `</div>`;
        
        if (node.evolves_to && node.evolves_to.length > 0) {
            html += `<div class="evolution-arrow">→</div>`;
            for (const nextNode of node.evolves_to) {
                html += await addEvolution(nextNode);
            }
        }
        
        return html;
    };
    
    try {
        const html = await addEvolution(chain);
        if (html.trim()) {
            evolutionsChain.innerHTML = html;
            evolutionsSection.style.display = 'block';
        } else {
            evolutionsSection.style.display = 'none';
        }
    } catch (e) {
        console.error('Error displaying evolution chain:', e);
        evolutionsSection.style.display = 'none';
    }
};

const getPokemonData = async (pokemon) => {
    try {
        // show spinner while loading (place into gallery track so it is removed when gallery renders)
        if (galleryTrack) galleryTrack.innerHTML = `<div class="spinner" aria-hidden="true"></div>`;
        else spriteContainer.innerHTML = `<div class="spinner" aria-hidden="true"></div>`;
        document.querySelector('.container')?.classList.add('animate');

        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon}`);
        if (!response.ok) throw new Error('Pokémon not found');
        const data = await response.json();

        pokemonName.textContent = data.name.toUpperCase();
        pokemonID.textContent = `ID: ${data.id}`;
        types.innerHTML = data.types.map(t => `<span class="type ${t.type.name}">${t.type.name}</span>`).join('');
        // PokeAPI: weight in hectograms (hg), height in decimetres (dm)
        const weightKg = (data.weight / 10).toFixed(1);
        const weightG = data.weight * 100;
        weight.textContent = `Weight: ${weightKg} kg (${weightG} g)`;

        const heightM = (data.height / 10).toFixed(1);
        const heightCm = data.height * 10;
        height.textContent = `Height: ${heightM} m (${heightCm} cm)`;
        // animate stats counting up
        const animateValue = (el, end, duration = 700) => {
            const start = 0;
            const range = end - start;
            let startTime = null;
            const step = (timestamp) => {
                if (!startTime) startTime = timestamp;
                const progress = Math.min((timestamp - startTime) / duration, 1);
                el.textContent = Math.floor(progress * range + start);
                if (progress < 1) requestAnimationFrame(step);
                else el.textContent = end;
            };
            requestAnimationFrame(step);
        };

        animateValue(hp, data.stats[0].base_stat);
        animateValue(attack, data.stats[1].base_stat);
        animateValue(defense, data.stats[2].base_stat);
        animateValue(specialAttack, data.stats[3].base_stat);
        animateValue(specialDefense, data.stats[4].base_stat);
        animateValue(speed, data.stats[5].base_stat);

        // Abilities
        abilitiesDiv.innerHTML = `<div class="abilities">Abilities: ${data.abilities.map(a => a.ability.name).join(', ')}</div>`;

        // Hero gradient and hero types
        const primaryType = data.types[0]?.type?.name || 'normal';
        const grad = typeGradients[primaryType] || ['#ffffff22', '#ffffff11'];
        if (hero) hero.style.background = `linear-gradient(90deg, ${grad[0]}, ${grad[1]})`;
        if (heroTypes) heroTypes.innerHTML = data.types.map(t => `<span class="type ${t.type.name}">${t.type.name}</span>`).join('');

        // Sprite + gallery (collect several sprite urls)
        const candidates = [
            data.sprites.front_default,
            data.sprites.back_default,
            data.sprites.front_shiny,
            data.sprites.back_shiny,
            data.sprites.other?.['official-artwork']?.front_default
        ];
        gallerySprites = [...new Set(candidates.filter(Boolean))];
        galleryIndex = 0;
        const renderGallery = () => {
            if (!gallerySprites.length) {
                spriteContainer.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.6)">No image</div>`;
                galleryTrack.innerHTML = `<div style="width:140px;height:140px;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.6)">No image</div>`;
                return;
            }
            const url = gallerySprites[galleryIndex];
            spriteContainer.innerHTML = `<img src="${url}" alt="${data.name} sprite" id="pokemon-sprite">`;
            galleryTrack.innerHTML = `<img src="${url}" alt="sprite-${galleryIndex}" class="gallery-img" style="opacity:0;transform:translateY(6px)">`;
            const img = galleryTrack.querySelector('img');
            requestAnimationFrame(() => { img.style.opacity = '1'; img.style.transform = 'translateY(0)'; });
        };
        renderGallery();

        galleryPrev.onclick = () => { if (!gallerySprites.length) return; galleryIndex = (galleryIndex - 1 + gallerySprites.length) % gallerySprites.length; renderGallery(); };
        galleryNext.onclick = () => { if (!gallerySprites.length) return; galleryIndex = (galleryIndex + 1) % gallerySprites.length; renderGallery(); };

        // Stats panel (simple) - capitalize stat names
        const formatStatName = (name) => name.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
        if (statsDiv) {
            statsDiv.innerHTML = data.stats.map(s => `<div style="font-size:13px;margin:2px 0"><strong>${formatStatName(s.stat.name)}:</strong> ${s.base_stat}</div>`).join('');
        }

        // Fetch evolution chain and description
        try {
            const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${data.id}`);
            if (speciesRes.ok) {
                const speciesData = await speciesRes.json();
                
                // Get Pokédex description (flavor text)
                const englishEntry = speciesData.flavor_text_entries.find(entry => entry.language.name === 'en');
                if (englishEntry) {
                    const cleanedDescription = englishEntry.flavor_text.replace(/[\n\f]/g, ' ').trim();
                    pokemonDescription.textContent = cleanedDescription;
                    descriptionSection.style.display = 'block';
                } else {
                    descriptionSection.style.display = 'none';
                }
                
                // Get evolution chain
                const evolutionChainRes = await fetch(speciesData.evolution_chain.url);
                if (evolutionChainRes.ok) {
                    const chainData = await evolutionChainRes.json();
                    await displayEvolutionChain(chainData.chain);
                }
            }
        } catch (e) {
            console.error('Failed to fetch evolution chain:', e);
            evolutionsSection.style.display = 'none';
            descriptionSection.style.display = 'none';
        }

        // Chart.js radar chart for stats
        const statLabels = data.stats.map(s => formatStatName(s.stat.name));
        const statValues = data.stats.map(s => s.base_stat);
        const ctx = document.getElementById('stats-chart');
        if (ctx) {
            const maxVal = Math.max(...statValues);
            if (statsChart) {
                statsChart.data.labels = statLabels;
                statsChart.data.datasets[0].data = statValues;
                statsChart.options.scales.r.max = maxVal + 20;
                statsChart.update();
            } else {
                statsChart = new Chart(ctx, {
                    type: 'radar',
                    data: {
                        labels: statLabels,
                        datasets: [{
                            label: data.name.toUpperCase(),
                            data: statValues,
                            backgroundColor: 'rgba(125,211,252,0.18)',
                            borderColor: 'rgba(124,58,237,0.9)',
                            pointBackgroundColor: 'rgba(124,58,237,0.9)'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            r: {
                                beginAtZero: true,
                                max: maxVal + 20,
                                ticks: { stepSize: Math.max(10, Math.floor((maxVal + 20) / 5)), color: 'rgba(255,255,255,0.7)' },
                                pointLabels: { color: 'rgba(255,255,255,0.9)', font: { size: 11 } }
                            }
                        },
                        elements: { line: { borderWidth: 2 } }
                    }
                });
                // set canvas size to make chart clearer
                ctx.style.height = '220px';
            }
        }

    } catch (error) {
        console.error('Error fetching Pokémon data:', error);
        alert('Pokémon not found. Please try again.');
    }
};

const resetDisplay = () => {
    spriteContainer.innerHTML = '';
    pokemonName.textContent = '';
    pokemonID.textContent = '';
    types.textContent = '';
    weight.textContent = '';
    height.textContent = '';
    hp.textContent = '';
    attack.textContent = '';
    defense.textContent = '';
    specialAttack.textContent = '';
    specialDefense.textContent = '';
    speed.textContent = '';
    abilitiesDiv.textContent = '';
    if (statsDiv) statsDiv.textContent = '';
    evolutionsChain.innerHTML = '';
    evolutionsSection.style.display = 'none';
};

const getPokemon = () => {
    const value = searchInput.value.trim();
    if (!value) return;
    resetDisplay();
    getPokemonData(value.toLowerCase());
};

// Autocomplete listeners
searchInput.addEventListener('input', (e) => {
  showSuggestions(e.target.value);
});

searchInput.addEventListener('keydown', (e) => {
  const items = suggestionsDropdown.querySelectorAll('li');
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    suggestionIndex = Math.min(suggestionIndex + 1, items.length - 1);
    updateActiveSuggestion(items);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    suggestionIndex = Math.max(suggestionIndex - 1, -1);
    updateActiveSuggestion(items);
  } else if (e.key === 'Enter' && suggestionIndex >= 0) {
    e.preventDefault();
    selectSuggestion(items[suggestionIndex].textContent);
  }
});

const updateActiveSuggestion = (items) => {
  items.forEach((el, i) => el.classList.toggle('active', i === suggestionIndex));
};

suggestionsDropdown.addEventListener('click', (e) => {
  if (e.target.tagName === 'LI') {
    selectSuggestion(e.target.textContent);
  }
});

searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    getPokemon();
});

