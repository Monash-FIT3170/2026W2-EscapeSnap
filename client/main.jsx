import 'meteor-node-stubs';
import { Meteor } from 'meteor/meteor';
import React from 'react';
import { createRoot } from 'react-dom/client';
import './main.css';
import { App } from '../imports/ui/App';
import { BrowserRouter } from 'react-router-dom';

Meteor.startup(() => {
  createRoot(document.getElementById('app')).render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
});
