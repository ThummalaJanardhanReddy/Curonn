// Centralized asset imports for better management and type safety
import ArrowLeft from './AppIcons/Curonn_icons/arrow_left.svg';
import location from './AppIcons/Curonn_icons/location.svg';
import locationfill from './AppIcons/Curonn_icons/locationfill.svg';

import asthma from './AppIcons/Curonn_icons/medicalConditions/asthma.svg';
import diabetes from './AppIcons/Curonn_icons/medicalConditions/diabetes.svg';
import heartDisease from './AppIcons/Curonn_icons/medicalConditions/heart.svg';
import hypertension from './AppIcons/Curonn_icons/medicalConditions/hypertension.svg';
import noIssues from './AppIcons/Curonn_icons/medicalConditions/noIssues.svg';
import thyroid from './AppIcons/Curonn_icons/medicalConditions/thyroid.svg';
import HomeIcon from './AppIcons/Curonn_icons/menu/new/home.svg';
// import LabTestsIcon from './AppIcons/Curonn_icons/menu/labtest_ic.svg';
import MyDoctorIcon from './AppIcons/Curonn_icons/menu/mydoctor_ic.svg';
import LabTestsIcon from './AppIcons/Curonn_icons/menu/new/lab_tests.svg';
import MedicinesIcon from './AppIcons/Curonn_icons/menu/new/medicines.svg';
import OrdersIcon from './AppIcons/Curonn_icons/menu/new/orders.svg';
import notificationIcon from './AppIcons/Curonn_icons/notification_ic.svg';
import ProfileIcon from './AppIcons/Curonn_icons/profile_ic.svg';
import CuronnLogo from './AppIcons/logo.svg';
import ArrowLeftSimple from './icons/arrow-left.svg';
import TestsPage from './images/panels/TestPage.svg';
// import profile_current_location from './AppIcons/Curonn_icons/Profile/current_location.svg';
import edit from './AppIcons/Curonn_icons/edit.svg';
import profile_drug_allergies from './AppIcons/Curonn_icons/Profile/drug_allergies.svg';
import profile_environmental_allergies from './AppIcons/Curonn_icons/Profile/environmental _allergies.svg';
import profile_family_history from './AppIcons/Curonn_icons/Profile/family_history.svg';
import profile_food_allergies from './AppIcons/Curonn_icons/Profile/food_allergies.svg';
import profile_medical_history from './AppIcons/Curonn_icons/Profile/medical_history.svg';
import profile_menstrual_history from './AppIcons/Curonn_icons/Profile/menstrual_history.svg';
import profile_past_procedures from './AppIcons/Curonn_icons/Profile/Past_Procedures.svg';
import profile_social_habits from './AppIcons/Curonn_icons/Profile/social_history.svg';

// New History PNG Icons (no spaces in filenames for Metro compatibility)
const env_allergy_png = require('./AppIcons/Curonn_icons/History_icons/environmental_allergies.png');
const family_history_png = require('./AppIcons/Curonn_icons/History_icons/family_history.png');
const food_allergy_png = require('./AppIcons/Curonn_icons/History_icons/food_allergies.png');
const drug_allergy_png = require('./AppIcons/Curonn_icons/History_icons/drug_allergies.png');
const medical_history_png = require('./AppIcons/Curonn_icons/History_icons/medical_history.png');
const past_procedures_png = require('./AppIcons/Curonn_icons/History_icons/past_procedures.png');
const social_habits_png = require('./AppIcons/Curonn_icons/History_icons/social_habits.png');
const menstrual_history_png = require('./AppIcons/Curonn_icons/History_icons/menstrual_history.png');

// Settings
import about from './AppIcons/Curonn_icons/Profile/about_curron.svg';
import addFamily from './AppIcons/Curonn_icons/Profile/add_my_family.svg';
import ambulance from './AppIcons/Curonn_icons/Profile/ambulance.svg';
import rateApp from './AppIcons/Curonn_icons/Profile/app_ratings.svg';
import healthFeed from './AppIcons/Curonn_icons/Profile/ariticals.svg';
import arrowRight from './AppIcons/Curonn_icons/Profile/arrow-right.svg';
import logout from './AppIcons/Curonn_icons/Profile/logout.svg';
import myOrders from './AppIcons/Curonn_icons/Profile/myorder.svg';
import privacyPolicy from './AppIcons/Curonn_icons/Profile/privacy_policy.svg';
import tAndC from './AppIcons/Curonn_icons/Profile/terms-and-conditions.svg';
// import version from './AppIcons/Curonn_icons/Profile/version.svg';

//home
import arrow_card from './AppIcons/Curonn_icons/arrow_card.svg';
import book_ambulance from './AppIcons/Curonn_icons/bookambulance_card.svg';
import book_labtest from './AppIcons/Curonn_icons/booklab_test_card.svg';
import book_wellness from './AppIcons/Curonn_icons/wellness_program_card.svg';
// import wellness_card from './AppIcons/Curonn_icons/wellness_program_card.svg';

import notificationBell_svg from './AppIcons/Curonn_icons/bell_ic.svg';

//lab orders
import vitamins_iron from './AppIcons/Curonn_icons/lab_orders/vitamins_iron.svg';
// import typhoid from './AppIcons/Curonn_icons/lab_orders/typhoid.svg';
// import diabetes from './AppIcons/Curonn_icons/lab_orders/diabetes.svg';
// import allergy from './AppIcons/Curonn_icons/lab_orders/allergy.svg';
// import kidney from './AppIcons/Curonn_icons/lab_orders/kidney.svg';
// import full_body from './AppIcons/Curonn_icons/lab_orders/full_body.svg';
// import cardiac from './AppIcons/Curonn_icons/lab_orders/cardiac.svg';


// Images
export const images = {
  labicon: require('./AppIcons/Curonn_icons/labicon.png'),
  medicalicon: require('./AppIcons/Curonn_icons/medicalicon.png'),
  consultationicon: require('./AppIcons/Curonn_icons/consultation.png'),
  ambulanceicon: require('./AppIcons/Curonn_icons/ambulance_order.png'),

  appIcon: require('./AppIcons/appIcon.png'),
  // Splash Screen
  splashScreen: require('./images/Splash_Screen.png'),
  splashScreenImg: require('./images/welcome.png'),

  // Welcome Screen
  welcome: require('./images/welcome.png'),

  // Logo
  curonnLogo: CuronnLogo,

  medicalCondition: require('./images/medicalCondition.png'),

  // Icons
  profile: ProfileIcon,
  profile1: require('./images/profile1.png'),
  profilemale: require('./images/maleicon.jpg'),
  profilefemale: require('./images/femaleicon.jpg'),
  notification: require('./AppIcons/Curonn_icons/notification_list_ic.png'), // notification,
  notification_bell_svg: notificationBell_svg,
  notificationIcon: notificationIcon,
  consultDoctor: require('./images/consultDoctor.png'),
  yogaLady: require('./images/yogaLady.png'), // yogaLady,
  labtest: require('./images/labtest.png'),
  happyLife: require('./images/happyLife.png'),
  healthArticle: require('./images/healthArtical.png'),
  favicon: require('./images/favicon.png'),
  transformLife: require('./images/transform_text.png'),
  scooty: require('./images/scooty.png'),
  ambulance: require('./images/ambulance.png'),
  sampleCollectionStep1: require('./images/sampleCollectionProcess1.png'),
  sampleCollectionStep2: require('./images/sampleCollectionProcess2.png'),
  sampleCollectionStep3: require('./images/sampleCollectionProcess3.png'),
  labdefault: require('./AppIcons/Curonn_icons/lab_detault_ic.png'),
  healthpackage: require('./images/healthpackage.jpg'),
  //home
  home: {
    arrow_card: arrow_card,
    book_ambulance: book_ambulance,
    book_labtest: book_labtest,
    book_wellness: book_wellness,
    doctor_card: require('./AppIcons/Curonn_icons/doctor.png'), // doctor_card,
    medicine_card: require('./AppIcons/Curonn_icons/medicine_order.png'), // medicine_card,
  },

  // Panels
  panels: {
    ambulance: require('./AppIcons/panels/panel_ambulance.png'),
    labTest: require('./AppIcons/panels/panel_labtest.png'),
    wellness: require('./AppIcons/panels/panel_wellness.png'),
    medicalCondition: require('./images/panels/medicalCondition.png'),
    landingPage: require('./images/panels/landingPage.png'),
    happyLife: require('./images/panels/happyLife.png'),
    addFamily: require('./images/panels/addFamily.png'),
    // personalization_bottom: PersonalizationBottom,
    personalization_bottom: require('./AppIcons/bg_img.png'),
    testsPage: TestsPage,
  },
  // Medical Conditions
  medicalConditions: {
    diabetes: diabetes,
    hypertension: hypertension,
    thyroid: thyroid,
    asthma: asthma,
    heartDisease: heartDisease,
    noIssues: noIssues,
    // issues: noIssues
  },
  // Profile
  profileModal: {
    // SVG versions (kept for backward compatibility)
    medicalHistory: profile_medical_history,
    familyHistory: profile_family_history,
    pastProcedures: profile_past_procedures,
    socialHabits: profile_social_habits,
    foodAllergies: profile_food_allergies,
    drugAllergies: profile_drug_allergies,
    environmentalAllergies: profile_environmental_allergies,
    menstrualHistory: profile_menstrual_history,
    familyHistory_png: require('./AppIcons/Curonn_icons/Profile/family_history.png'),

    // PNG versions from History_icons (used in profile list)
    medicalHistory_png: medical_history_png,
    familyHistory_png_new: family_history_png,
    pastProcedures_png: past_procedures_png,
    socialHabits_png: social_habits_png,
    foodAllergies_png: food_allergy_png,
    drugAllergies_png: drug_allergy_png,
    environmentalAllergies_png: env_allergy_png,
    menstrualHistory_png: menstrual_history_png,
  },

  //lab orders
  labOrders: {
    vitamins_iron: vitamins_iron,
  },

  // Tabs
  tabs: {
    home: HomeIcon,
    labTests: LabTestsIcon,
    medicines: MedicinesIcon,
    myDoctor: MyDoctorIcon,
    orders: OrdersIcon,
  },
  menu: {
    home: require('./AppIcons/Curonn_icons/menu/new/home.svg'),
    home_selected: require('./AppIcons/Curonn_icons/menu/png/home_select.png'),
    labTests: require('./AppIcons/Curonn_icons/menu/png/lab.png'),
    labTests_selected: require('./AppIcons/Curonn_icons/menu/png/lab_select.png'),
    medicines: require('./AppIcons/Curonn_icons/menu/png/medicine.png'),
    medicines_selected: require('./AppIcons/Curonn_icons/menu/png/medicine_select.png'),
    myDoctor: require('./AppIcons/Curonn_icons/menu/png/doctor.png'),
    myDoctor_selected: require('./AppIcons/Curonn_icons/menu/png/doctor_select.png'),
    orders: require('./AppIcons/Curonn_icons/menu/png/orders.png'),
    orders_selected: require('./AppIcons/Curonn_icons/menu/png/orders_select.png'),
  },

  // Other icons
  icons: {
    about: require('./icons/about.png'),
    calendar: require('./icons/calendar.png'),
    cart: require('./icons/cart.png'),
    close: require('./icons/close.png'),
    group9710: require('./icons/Group 9710.png'),
    group9987: require('./icons/Group 9987.png'),
    ambulance: require('./icons/Icon awesome-ambulance.png'),
    calendarAlt: require('./icons/Icon awesome-calendar-alt.png'),
    edit: edit, // require('./icons/Icon feather-edit.png'),
    search: require('./icons/Icon feather-search.png'),
    addCircle: require('./icons/add.png'),
    // location: require('./icons/Icon material-location-on.png'), 
    logout: require('./icons/Icon open-account-logout.png'),
    feedly: require('./icons/Icon simple-feedly.png'),
    privacy: require('./icons/privacy.png'),
    rating: require('./icons/rating.png'),
    termsAndConditions: require('./icons/terms-and-conditions.png'),
    arrow_left: ArrowLeft,
    arrow_left_simple: ArrowLeftSimple,
    location: location,
    locationfill: locationfill,

    settings: {
      addFamily: addFamily,
      myOrders: myOrders,
      healthFeed: healthFeed,
      ambulance: ambulance,
      about: about,
      rateApp: rateApp,
      tAndC: tAndC,
      privacyPolicy: privacyPolicy,
      logout: logout,
      arrowRight: arrowRight,
    }
  },
} as const;

// Type definitions for better TypeScript support
export type ImageKey = keyof typeof images;
export type PanelImageKey = keyof typeof images.panels;
export type TabImageKey = keyof typeof images.tabs;
export type IconImageKey = keyof typeof images.icons;

// Helper function to get image by key
export const getImage = (key: ImageKey) => images[key];

// Helper function to get panel image
export const getPanelImage = (key: PanelImageKey) => images.panels[key];

// Helper function to get tab image
export const getTabImage = (key: TabImageKey) => images.tabs[key];

// Helper function to get icon image
export const getIconImage = (key: IconImageKey) => images.icons[key];
