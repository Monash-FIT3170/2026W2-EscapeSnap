import React from 'react';
import 'meteor-node-stubs';
import { Meteor } from 'meteor/meteor';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './main.css';
import './room.css';
import { App } from '../imports/ui/App';
import { LanguageProvider } from '../imports/languages/LanguageProvider';
import { UiThemeProvider } from '../imports/ui/shared/components/theme/UiThemeProvider';

Meteor.startup(() => {
  createRoot(document.getElementById('app')).render(
    <LanguageProvider>
      <UiThemeProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </UiThemeProvider>
    </LanguageProvider>
  );
});
