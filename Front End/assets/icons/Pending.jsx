import * as React from "react";
import Svg, { Path } from "react-native-svg";

const Pending = (props) => (
  <Svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color="#ffffff" fill="none" {...props}>
    <Path 
      d="M16 12H12L12 6" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    <Path 
      d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    <Path 
      d="M18.8475 4.17041C19.0217 4.3242 19.1911 4.48354 19.3555 4.648C19.5199 4.81246 19.6791 4.98203 19.8328 5.15629M15 2C15.4821 2.14255 15.9548 2.32634 16.4134 2.54664M21.4375 7.55457C21.6647 8.02313 21.8539 8.50663 22 9" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
  </Svg>
);

export default Pending;
