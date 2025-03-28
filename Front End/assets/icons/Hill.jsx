import * as React from "react";
import Svg, { Path } from "react-native-svg";

const Hill = (props) => (
  <Svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color="#ffffff" fill="none" {...props}>
    <Path 
      d="M16 20H2L5.22457 10.7557C6.79555 6.25189 7.58104 4 9 4C10.3373 4 11.1119 6 12.5116 10" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinejoin="round" 
    />
    <Path 
      d="M6 20H22L17.4066 12.6585C15.8806 10.2195 15.1176 9 14 9C12.8824 9 12.1194 10.2195 10.5934 12.6585L9.12837 15" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
  </Svg>
);

export default Hill;
