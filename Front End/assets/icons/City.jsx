import * as React from "react";
import Svg, { Path, Ellipse } from "react-native-svg";

const City = (props) => (
  <Svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color="#ffffff" fill="none" {...props}>
    <Path 
      d="M13 16.7033C13 15.7854 13 15.3265 13.2034 14.9292C13.4067 14.5319 13.7859 14.2501 14.5442 13.6866L15.0442 13.315C16.2239 12.4383 16.8138 12 17.5 12C18.1862 12 18.7761 12.4383 19.9558 13.315L20.4558 13.6866C21.2141 14.2501 21.5933 14.5319 21.7966 14.9292C22 15.3265 22 15.7854 22 16.7033V18.1782C22 19.9798 22 20.8806 21.4142 21.4403C20.8284 22 19.8856 22 18 22H13V16.7033Z" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinejoin="round" 
    />
    <Path 
      d="M18 12.0002V5C18 2.518 17.482 2 15 2H11C8.518 2 8 2.518 8 5V22" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    <Ellipse cx="3.5" cy="14" rx="1.5" ry="2" stroke="currentColor" strokeWidth="1.5" />
    <Path d="M3.5 16V22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <Path d="M2 22H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <Path d="M12 6H14M12 9H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <Path d="M17.5 22L17.5 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export default City;
