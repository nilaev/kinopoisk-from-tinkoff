const searchBoxInput = document.querySelector('.search-box__input');
const baseResults = document.querySelector('.base__results');
const baseSuggestionsBox = document.querySelector('.base__suggestions-box');
let searches = [
    'Star Wars',
    'Kung Fury',
    'Back to the Future',
    'Matrix',
    'Terminator',
];

if (sessionStorage.getItem('curStatus') === 'ready') {
    searchBoxInput.value = JSON.parse(sessionStorage.getItem('input'));
    searches = JSON.parse(sessionStorage.getItem('searches'));

    document.body.classList.add('search_active');
    searchBoxInput.style.color = "white";
    renderSuggestionsBox();
    searchByValue(searchBoxInput.value)
}


searchBoxInput.addEventListener('click', () => {
    document.body.classList.add('search_active')
    renderSuggestionsBox();
});
searchBoxInput.addEventListener('input', () => searchBoxInput.style.color = "white");
searchBoxInput.addEventListener('keydown', async function (event) {
    if (event.keyCode === 13) {
        searchByValue(this.value.toString())
    }
});

function searchByValue(value) {
    let valueIndex = searches.indexOf(value);
    if (valueIndex !== -1) {
        searches.splice(valueIndex, 1);
    }
    searches.unshift(value);
    renderSuggestionsBox();

    searchOmdbapi(value).then(res => {
        if (res.hasOwnProperty('error')) {
            document.body.classList.remove('search_live')
            document.body.classList.add('search_not_found');
            console.log(res['error']);
        } else {
            showResultCards(res);
            document.body.classList.remove('search_not_found');
            document.body.classList.add('search_live')
        }
    });
}

async function searchOmdbapi(searchTerm) {
    try {
        const data = await fetch(`http://www.omdbapi.com/?s=${searchTerm}&plot=full&apikey=a0625832`).then(r => r.json());
        return data.Response === 'True' ? data : {error: data.Error};
    } catch (error) {
        return {error};
    }
}

function showResultCards(data) {
    document.querySelector('.base__result_info--counter').textContent = `Нашли ${data['totalResults']} фильмов`;
    baseResults.replaceChildren();
    for (const elem of data['Search']) {
        sessionStorage.setItem('curStatus', 'ready');
        sessionStorage.setItem('input', JSON.stringify(searchBoxInput.value));
        sessionStorage.setItem('searches', JSON.stringify(searches));
        baseResults.insertAdjacentHTML('beforeend',
            `<button type="button" class="results__card card" 
                    onclick="document.location.href = 'https://www.imdb.com/title/${elem.imdbID}/';">
                    <img src=${elem.Poster} class="card__img" alt="movie"/>
                    <div class="card__info card__info--background-gradient">
                        <p class="card__info__name card__info__name--white">${elem.Title}</p>
                        <div class="card__info__category">
                            <p class="card__info__category card__info__category--text-margins">${elem.Type}</p>
                            <p class="card__info__category card__info__category--text-margins">${elem.Year}</p>
                        </div>
                    </div>
                </button>`);
    }
}

document.querySelector('.search-box__cross').addEventListener('click', function () {
    searchBoxInput.value = '';
    searchBoxInput.placeholder = '';
});


function renderSuggestionsBox() {
    while (baseSuggestionsBox.firstChild) {
        baseSuggestionsBox.removeChild(baseSuggestionsBox.firstChild);
    }
    for (let i = 0; i < searches.length; i++) {
        baseSuggestionsBox.insertAdjacentHTML('beforeend',
            `<button type="button" class="base__suggestions-box__button"
                id="suggestions-box-button-${i}">${searches[i]}</button>`);
    }
    for (let i = 0; i < searches.length; i++) {
        document.querySelector(`#suggestions-box-button-${i}`).addEventListener('dblclick',  () => {
            searches.splice(i, 1);
            renderSuggestionsBox();
        });
        document.querySelector(`#suggestions-box-button-${i}`).addEventListener('click', function () {
            suggestionsBoxButtonSearch(searches[i]);
        });
    }
}

function suggestionsBoxButtonSearch(text) {
    searchBoxInput.style.color = "white";
    searchBoxInput.value = text;
    searchByValue(searchBoxInput.value);
}



