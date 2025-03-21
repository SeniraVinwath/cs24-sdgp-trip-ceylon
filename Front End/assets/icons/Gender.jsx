import * as React from "react";
import Svg, { Path } from "react-native-svg";

const Gender = (props) => (
  <Svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color="#ffffff" fill="none" {...props}>
    <Path d="M21 9C21 12.3137 18.3137 15 15 15C11.6863 15 9 12.3137 9 9C9 5.68629 11.6863 3 15 3C18.3137 3 21 5.68629 21 9Z" stroke="currentColor" strokeWidth={props.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M3 15V17C3 18.8856 3 19.8284 3.58579 20.4142C4.17157 21 5.11438 21 7 21H9M4 20L10.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export default Gender;
