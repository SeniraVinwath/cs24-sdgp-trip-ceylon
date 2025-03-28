import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import Home from './Home';
import { theme } from '../../constants/theme';
import ArrowLeft from './ArrowLeft';
import Mail from './Mail';
import Lock from './Lock';
import User from './User';
import ViewTrue from './Viewture';
import ViewFalse from './Viewfalse';
import Calendar from './Calendar';
import Contact from './Contact';
import Language from './Language';
import ArrowRight from './ArrowRight';
import GlobalSearch from './GlobalSearch';
import Notification from './Notification';
import AddNew from './AddNew';
import Profile from './Profile';
import ArrowDown from './ArrowDown';
import Luggage from './Luggage';
import Itinerary from './Itinarary';
import ArrowUp from './ArrowUp';
import Connect2 from './Connect2';
import LogOut2 from './LogOut2';
import Edit from './Edit';
import Gender from './Gender';
import Cake from './Cake';
import Camera from './Camera';
import Location from './Location';
import ConName from './ConName';
import Image from './Image';
import Video from './Video';
import Delete from './Delete';
import More from './More';
import Heart from './Heart';
import Comment from './Comment';
import Globe from './Globe';
import Share4 from './Share4';
import Bookmark from './Bookmark';
import Send from './Send';
import FindTravelers from './FindTravelers';
import MyConnections from './MyConnections';
import Pending from './Pending';
import ViewMap from './ViewMap';
import Anon from './Anon';
import Beach from './Beach';
import Surf from './Surf';
import City from './City';
import History from './History';
import Culture from './Culture';
import Hill from './Hill';
import Safari from './Safari';
import Adventure from './Adventure';

const icons = {
    home: Home,
    arrowLeft: ArrowLeft,
    mail: Mail,
    lock: Lock,
    user: User,
    viewTrue: ViewTrue,
    viewFalse: ViewFalse,
    calendar: Calendar,
    contact: Contact,
    language: Language,
    arrowRight: ArrowRight,
    globalSearch: GlobalSearch,
    notification: Notification,
    addNew: AddNew,
    profile: Profile,
    arrowDown: ArrowDown,
    connect2: Connect2,
    luggage: Luggage,
    itinerary: Itinerary,
    arrowUp: ArrowUp,
    logout2: LogOut2,
    edit: Edit,
    gender: Gender,
    cake: Cake,
    camera: Camera,
    location: Location,
    conName: ConName,
    image:Image,
    video:Video,
    delete:Delete,
    more:More,
    heart:Heart,
    comment:Comment,
    globe:Globe,
    share4: Share4,
    bookmark: Bookmark,
    send: Send,
    findTravelers: FindTravelers,
    myConnections: MyConnections,
    pending: Pending,
    viewMap: ViewMap,
    anon: Anon,
    beach: Beach,
    surf: Surf,
    city: City,
    history: History,
    culture: Culture,
    hill: Hill,
    safari: Safari,
    adventure: Adventure,

};

const Icon = ({ name, ...props }) => {
    const IconComponent = icons[name];
    return (
        <IconComponent
            height={props.size || 24}
            width={props.size || 24}
            strokeWidth={props.strokeWidth || 1.9}
            color={theme.colors.textWhite}
            {...props}
        />
    );
};

export default Icon;

const styles = StyleSheet.create({});
