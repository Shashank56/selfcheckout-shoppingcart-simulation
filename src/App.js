import React, {Component} from 'react';
import './App.css';
import Bill from './Components/Bill'
import Barcode from './Components/Barcode'
import Images from './Components/Images'
import {Container, Row, Col, Button} from "react-bootstrap"
import 'bootstrap/dist/css/bootstrap.min.css'; 
import filenames from "./Components/imgfilenamesobj"
import itemscsv from "./Components/itemsobj"

class App extends Component {
  constructor(props) {  
    super(props);
    this.handleBarcodeClick = this.handleBarcodeClick.bind(this);
    this.handleImageClick = this.handleImageClick.bind(this);
    this.handleSubmitClick = this.handleSubmitClick.bind(this);
    this.changeTitle = this.changeTitle.bind(this);
    this.state = { 
      barcode : [{id:'fogg',name:'Fogg Bodyspray',display:true},{id:'medimix',name:'Medimix soap',display:true}, {id:"redlabel",name:'3roses Teapowder',display:true}, {id:"goodday",name:'Goodday Buttercookies',display:true}],
      dropDownTitle : "Items",
      bill : [],
      images : [5,7,13,14],
      barcodeSelectedItem : undefined,
      imageSelected : undefined,
      submitButton : "Start Validation",
      submitFunction : this.handleSubmitClick,
      itemsPresentInBill : [],
      totalBill : 0
     }
  }
  handleBarcodeClick(id){
    this.setState({
      barcodeSelectedItem : id
    },function () {
      console.log(this.state.barcodeSelectedItem);
  })
  }

  handleImageClick(id){
    if(this.state.imageSelected === id){
    this.setState((prevState)=>{
      return {
        ...prevState,
      imageSelected : undefined
      }
    },function () {
      console.log(this.state);
  })}
    else{
    this.setState((prevState)=>{
      return {
        ...prevState,
      imageSelected : id
      }
    },function () {
      console.log(this.state);
  })}
}

  // here we use the state.barcodeselecteditem and state.imageSelected to perform validation using AWS and weights then
  // 1. Display "Success" or "Place again" and hide Images Component - Done
  // 2. If "Success" Add state.bill with validated item - Done
  // 3. If "Success" Update state.barcode.display for all items according to the images available
  // 4. If "Success" Call the function to list all the available images having the items present in the bill (and state.selectedItem is not needed
  //    because to show fraud detection cases) ,then update state.image and unhide Images component

  async handleSubmitClick() {
    this.setState({
      submitButton : "Validating..",
      submitFunction : undefined
    })
    var barcodeCombinedOutput = []
    var imageName = undefined
    this.state.bill.forEach(billeditem=>{
      barcodeCombinedOutput.push(billeditem.id)
    })
    barcodeCombinedOutput.push(this.state.barcodeSelectedItem)
    console.log(barcodeCombinedOutput)
    imageName = filenames[this.state.imageSelected].name
    var awsResult = await window["upload"](imageName)
    this.setState({
      submitButton : "Start Validation",
      submitFunction : this.handleSubmitClick
    })
    console.log(awsResult)
    if(awsResult.sort().join(',')=== barcodeCombinedOutput.sort().join(',')){
      var keyValidated = undefined
      for(let i=0;i<itemscsv.length;i++){
        if(this.state.barcodeSelectedItem === itemscsv[i].id){
          keyValidated = i
          break;
        }
      }
      this.setState(prevState => {
        return {
          ...prevState,
          totalBill : prevState.totalBill + parseInt(itemscsv[keyValidated].price)
        }
      })
      if (window.confirm("\t\t\tItem successfully validated and added to Bill.\t\t\t \n\n If you want to continue adding items press OK or If u want to checkout press cancel") == true) {
        this.setState((prevState)=>{
          return {
            ...prevState,
            bill: [...prevState.bill, {key:itemscsv[keyValidated].key,name:itemscsv[keyValidated].name,price:itemscsv[keyValidated].price,id:itemscsv[keyValidated].id}],
            itemsPresentInBill : [...prevState.itemsPresentInBill, itemscsv[keyValidated].id],
          }
        },function(){
          console.log(this.state.bill)
        })
        var nextImages = await window["imageselector"](this.state.itemsPresentInBill)
        console.log(nextImages)
        this.setState((prevState)=>{
          const barcodetemp = prevState.barcode.map(obj => {
            if(nextImages[1].includes(obj.id))
              return obj
            else
              return {
                ...obj,
                display: false
              }
          })
          return {
            ...prevState,
            barcode: barcodetemp,
            barcodeSelectedItem: undefined,
            imageSelected : undefined,
            images: nextImages[0],
            dropDownTitle: "Items"
          }
        },function(){
          console.log(this.state.barcode)
          if(this.state.images.length === 0){
            alert("All available items are added. Starting simulation again")
            this.setState({
              barcode : [{id:'fogg',name:'Fogg Bodyspray',display:true},{id:'medimix',name:'Medimix soap',display:true}, {id:"redlabel",name:'3roses Teapowder',display:true}, {id:"goodday",name:'Goodday Buttercookies',display:true}],
              dropDownTitle : "Items",
              bill : [],
              images : [5,7,13,14],
              barcodeSelectedItem : undefined,
              imageSelected : undefined,
              submitButton : "Start Validation",
              submitFunction : this.handleSubmitClick,
              itemsPresentInBill : [],
              totalBill : 0,
            })
          }
        })
      }
       else {
         alert("Checked out. Your total bill is " + this.state.totalBill + " . Starting simulation again")
          this.setState({
          barcode : [{id:'fogg',name:'Fogg Bodyspray',display:true},{id:'medimix',name:'Medimix soap',display:true}, {id:"redlabel",name:'3roses Teapowder',display:true}, {id:"goodday",name:'Goodday Buttercookies',display:true}],
          dropDownTitle : "Items",
          bill : [],
          images : [5,7,13,14],
          barcodeSelectedItem : undefined,
          imageSelected : undefined,
          submitButton : "Start Validation",
          submitFunction : this.handleSubmitClick,
          itemsPresentInBill : [],
          totalBill : 0,
        })
      }
    }
    else 
      alert('Fraud Detected. Place again');
      this.setState({
        barcodeSelectedItem : undefined,
        imageSelected : undefined,
        dropDownTitle : "Items"
      })
  }
  changeTitle(e) {
    this.setState({
        dropDownTitle: e.currentTarget.textContent
    })
  }
  render() { 
    return ( 
      <Container fluid>
      <Row>
        <Col xs={3} className="barcode">
            <Barcode availableitems = {this.state.barcode} barcodeClickFunction = {this.handleBarcodeClick} dropDownTitleProperty = {this.state.dropDownTitle} changeTitleFunction = {this.changeTitle}/>
        </Col>
        <Col className="images">
            <Images imageFiles = {this.state.images} imageClickFunction = {this.handleImageClick}/>
            {this.state.barcodeSelectedItem!==undefined && this.state.imageSelected!==undefined &&
              <div>
              <Button className = {this.state.addToCart} onClick={this.state.submitFunction} >{this.state.submitButton}</Button>
              </div>
            }
            {
              this.state.submitButton==="Validating.." &&
              <div style={{marginTop: 30}}>
                <h6>This may take a few seconds</h6>
                <h6>Validating using AWS custom object detection model</h6>
              </div>
            }
        </Col>
        <Col xs={3} className="bill">
            <Bill billeditems = {this.state.bill} totalBill = {this.state.totalBill}/>
        </Col>
      </Row>
    </Container>    
      
     );
  }
}
export default App;

