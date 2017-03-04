import React from 'react';
import ReactDOM from 'react-dom';
import reduxThunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import { Router, Route, IndexRoute, browserHistory } from 'react-router';
import axios from 'axios';

const createStoreWithMiddleware = applyMiddleware(reduxThunk)(createStore);

ReactDOM.render(
    <Provider>
        <Router history={browserHistory}>
            <Route path="/" component={App}>
                <IndexRoute component={Blog}/>
            </Route>
        </Router>
    </Provider>
    , document.querySelector('.container'));
