// import {makeRequests} from "./makeRequests";

function loadingCircle() {
    document.body.classList.add('loaded_hiding');
    window.setTimeout(function () {
        document.body.classList.add('loaded');
        document.body.classList.remove('loaded_hiding');
    }, 500);
}

window.onload = loadingCircle;

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
searchBoxInput.addEventListener('input', debounce(async function () {
    searchByValue(this.value.toString())
}, 1000));

function debounce(f, t) {
    return function (args) {
        let previousCall = this.lastCall;
        this.lastCall = Date.now();
        if (previousCall && ((this.lastCall - previousCall) <= t)) {
            clearTimeout(this.lastCallTimer);
        }
        this.lastCallTimer = setTimeout(() => f.apply(this, args), t);
    }
}

function searchByValue(value) {
    let valueIndex = searches.indexOf(value);
    if (valueIndex !== -1) {
        searches.splice(valueIndex, 1);
    }
    searches.unshift(value);
    renderSuggestionsBox();

    searchOmdbapi(value).then(res => {
        showResultCards(res);
        document.body.classList.remove('search_not_found');
        document.body.classList.add('search_live')
    }).catch(e => {
        document.body.classList.remove('search_live')
        document.body.classList.add('search_not_found');
        console.log(e);
    });
}

function cachingDecorator(func) {
    let cache = new Map();
    return function (x) {
        console.log(cache);
        if (cache.has(x)) {
            return cache.get(x);
        }
        let result = func.call(this, x);
        cache.set(x, result);
        return result;
    };
}

async function searchOmdbapi(searchTerm) {
    try {
        const data = await fetch(`http://www.omdbapi.com/?s=${searchTerm}&plot=full&apikey=a0625832`).then(r => r.json());
        return data.Response === 'True' ? data : data.Error;
    } catch (error) {
        return {error};
    }
}

searchOmdbapi = cachingDecorator(searchOmdbapi);

function showResultCards(data) {
    document.querySelector('.base__result_info--counter').textContent = `Нашли ${data['totalResults']} фильмов`;
    baseResults.replaceChildren();
    const urlsArray = [];

    for (let i = 0; i < data['Search'].length; i++) {
        const elem = data['Search'][i];
        urlsArray.push(`https://www.omdbapi.com/?i=${elem.imdbID}&apikey=a0625832`);

        sessionStorage.setItem('curStatus', 'ready');
        sessionStorage.setItem('input', JSON.stringify(searchBoxInput.value));
        sessionStorage.setItem('searches', JSON.stringify(searches));
        baseResults.insertAdjacentHTML('beforeend',
            `<button type="button" class="results__card card" 
                    onclick="document.location.href = 'https://www.imdb.com/title/${elem.imdbID}/';">
                    <img src=${elem.Poster} class="card__img" alt="movie"/>
                    <div class="card__info card__info--background-gradient">
                        <div class="card__info__rating">
                            <img class="card__info__rating__img" id='rating-img-${i}'>
                            <p class="card__info__rating__number" id='rating-number-${i}'></p>
                        </div>
                        <p class="card__info__name card__info__name--white">${elem.Title}</p>
                        <div class="card__info__category">
                            <p class="card__info__category card__info__category--text-margins">${elem.Type}</p>
                            <p class="card__info__category card__info__category--text-margins">${elem.Year}</p>
                        </div>
                    </div>
                </button>`);
    }

    makeRequests(urlsArray, urlsArray.length).then(res => {
        let i = 0;
        for (const re of res) {
            const ratingNumber = Number(re.imdbRating);
            let ratingImg = 'img/results/';
            if (ratingNumber > 7.9) {
                ratingImg += 'score5.svg';
            } else if (ratingNumber > 5.9) {
                ratingImg += 'score4.svg';
            } else if (ratingNumber > 3.9) {
                ratingImg += 'score3.svg';
            } else if (ratingNumber > 1.9) {
                ratingImg += 'score2.svg';
            } else {
                ratingImg += 'score1.svg';
            }

            console.log(ratingImg, ratingNumber);
            let idRatingImg = document.querySelector(`#rating-img-${i}`);
            let idRatingNum = document.querySelector(`#rating-number-${i}`);
            idRatingImg.src = ratingImg;
            idRatingNum.textContent = `${ratingNumber}`;
            i++;
        }
    });
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
        document.querySelector(`#suggestions-box-button-${i}`).addEventListener('dblclick', () => {
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


const makeRequests = (urls, maxRequests) => {
    const ans = Array(urls.length)
        .fill(null);

    // eslint-disable-next-line no-use-before-define
    const urlsMap = countUrlsMap(urls);

    const uniqueUrls = Object.keys(urlsMap);

    let countRequests = 0;

    let countResponses = 0;

    // eslint-disable-next-line no-param-reassign
    maxRequests = Math.floor(maxRequests);

    return new Promise(resolve => {
        for (let i = 0; i < Math.min(maxRequests, uniqueUrls.length); i++) {
            // eslint-disable-next-line no-use-before-define
            request();
        }

        function request() {
            // eslint-disable-next-line no-plusplus
            const url = uniqueUrls[countRequests++];

            // eslint-disable-next-line no-return-assign
            urlsMap[url].forEach(n => ans[n] = 'in progress');

            fetch(url)
                .then(res => res.json())
                .catch(_ => 'Error')
                .then(res => {
                    // eslint-disable-next-line no-use-before-define,no-return-assign
                    urlsMap[url].forEach(n => ans[n] = res);

                    // eslint-disable-next-line no-plusplus
                    if (++countResponses === uniqueUrls.length) {
                        resolve(ans);
                        setTimeout(() => {
                        }, 5000);
                        // eslint-disable-next-line no-shadow
                        // callback(new Promise(res => res(ans)));
                    } else if (countRequests < uniqueUrls.length) {
                        request();
                    }
                });

            setTimeout(() => {
            }, 5000);
            // eslint-disable-next-line no-console
            // callback(new Promise(res => res(ans)));
        }
    });
};

export function countUrlsMap(urls) {
    const urlsMap = {};

    for (let i = 0; i < urls.length; i++) {
        // eslint-disable-next-line no-prototype-builtins
        if (urlsMap.hasOwnProperty(urls[i])) {
            urlsMap[urls[i]].push(i);
        } else {
            urlsMap[urls[i]] = [i];
        }
    }
    return urlsMap;
}


