import React, { Component } from 'react';
import './App.css';
import { allLocation } from './locations.js';
import scriptLoader from 'react-async-script-loader';
import {mapCustomStyle} from './mapCustomStyle.js';
import escapeRegExp from 'escape-string-regexp';
import sortBy from 'sort-by';
import fetchJsonp from 'fetch-jsonp';

let markers = [];
let infoWindows = [];

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      locations: allLocation,
      map: {},
      query: '',
      requestWasSuccessful: true,
      selectedMarker:'',
      data:[]
    }
  }

  updatequery =(query) => {
    this.setState({query: query})
  }

  updateData = (newData) => {
    this.setState({
      data:newData,
    });
  }

  componentWillReceiveProps({isScriptLoadSucceed}){
    if (isScriptLoadSucceed) {
      const initMap = new window.google.maps.Map(document.getElementById('map'), {
        zoom: 15,
        center: new window.google.maps.LatLng(23.127415,113.256097),
        styles: mapCustomStyle
      });
      this.setState({map:initMap});
      const {locations, query, map} = this.state;
      let showingLocations=locations
      if (query){
        const match = new RegExp(escapeRegExp(query),'i')
        showingLocations = locations.filter((location)=> match.test(location.title))
      }
      else{
        showingLocations=locations
      }
      markers.forEach(mark => { mark.setMap(null) });
      markers = [];
      infoWindows = [];
      showingLocations.map((marker,index)=> {
      let getData = this.state.data.filter((single)=>marker.title === single[0][0]).map(item2=>
        {if (item2.length===0)
          return 'No Contents Have Been Found Try to Search Manual'
          else if (item2[1] !=='')
            return item2[1]
          else
            return 'No Contents Have Been Found Try to Search Manual'
        })
      let getLink = this.state.data.filter((single)=>marker.title === single[0][0]).map(item2=>
        {if (item2.length===0)
          return 'https://www.wikipedia.org'
          else if (item2[1] !=='')
            return item2[2]
          else
            return 'https://www.wikipedia.org'
        })
      let content =
      `<div tabIndex="0" class="infoWindow">
      <h4>${marker.title}</h4>
      <p>${getData}</p>
      <a href=${getLink}>Click Here For More Info</a>

      </div>`
        let addInfoWindow= new window.google.maps.InfoWindow({
          content: content,
        });
        let bounds = new window.google.maps.LatLngBounds();
        let addmarker = new window.google.maps.Marker({
          map: initMap,
          position: marker.location,
          animation: window.google.maps.Animation.DROP,
          name : marker.title
        });
        markers.push(addmarker);
        infoWindows.push(addInfoWindow);
        addmarker.addListener('click', function() {
            infoWindows.forEach(info => { info.close() });
            addInfoWindow.open(map, addmarker);
            if (addmarker.getAnimation() !== null) {
              addmarker.setAnimation(null);
            } else {
              addmarker.setAnimation(window.google.maps.Animation.BOUNCE);
              setTimeout(() => {addmarker.setAnimation(null);}, 400)
            }
          })
        markers.forEach((m)=>
          bounds.extend(m.position))
        initMap.fitBounds(bounds)
      })
    }
    else {
      console.log("Error:Cann't Load Google Map!");
      this.setState({requestWasSuccessful: false})
    }
  }

  componentDidMount(){
    this.state.locations.map((location,index)=>{
      return fetchJsonp(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${location.title}&format=json&callback=wikiCallback`)
      .then(response => response.json()).then((responseJson) => {
        let newData = [...this.state.data,[responseJson,responseJson[2][0],responseJson[3][0]]]
        this.updateData(newData)
      }).catch((err) => {
      console.log("Error:Can't load the wiki information!");
      })
    })
  }

  listItem = (item, event) => {
    let selected = markers.filter((currentOne)=> currentOne.name === item.title)
    window.google.maps.event.trigger(selected[0], 'click');

  }

  handleKeyPress(target,item,e) {
    if(item.charCode===13){
     this.listItem(target,e)
   }
 }

 render() {
  const {locations, query, requestWasSuccessful} = this.state;
    let showingLocations
    if (query){
      const match = new RegExp(escapeRegExp(query),'i')
      showingLocations = locations.filter((location)=> match.test(location.title))
    }
    else{
      showingLocations=locations
    }
    showingLocations.sort(sortBy('title'))
    return (
      requestWasSuccessful ? (
        <div>
        <nav className="nav">
        <span id="subject" tabIndex='0'>Guangzhou Historical Sites</span>
        </nav>
        <div id="container">
        <div id="map-container" role="application" tabIndex="-1">
        <div id="map" role="region" aria-label="Guangzhou Neighborhood"></div>
        </div>
      {/*List view that has input and list of locaitons*/}
      <div className='listView'>
      <input id="textToFilter" className='form-control' type='text'
      placeholder='search location'
      value={query}
      onChange={(event)=> this.updatequery(event.target.value)}
      role="search"
      aria-labelledby="Search For a Location"
      tabIndex="1"/>
      <ul aria-labelledby="list of locations" tabIndex="1">
    {/*JSON.stringify(this.state.query)*/}
    {showingLocations.map((getLocation, index)=>
      <li key={index} tabIndex={index+2}
      area-labelledby={`View details for ${getLocation.title}`} onKeyPress={this.handleKeyPress.bind(this,getLocation)} onClick={this.listItem.bind(this,getLocation)}>{getLocation.title}</li>)}
      </ul>
      </div>
      </div>
      </div>
      ) : (
      <div>
      <h1>Error:"Cann't Load Your Google Map"</h1>
      </div>
          )
      )
    }
  }

  export default scriptLoader(
    [`https://maps.googleapis.com/maps/api/js?key=AIzaSyCkMu54jW_NcFiplgaB0CLhRq41uygD3LQ&v=3.exp&libraries=geometry,drawing,places`]
    )(App);
