import 'babel-polyfill';
import * as tf from '@tensorflow/tfjs';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './game/constants';
import { Runner } from './game';
import {InitializeExcel, AppendToExcel } from './excel';

let runner = null;
let generation = 0
// initial setup for the game the  setup function is called when the dom gets loaded

function setup() {
  // Initialize the game Runner.
  runner = new Runner('.game', {
    DINO_COUNT: 1,
    onReset: handleReset,
    onCrash: handleCrash,
    onRunning: handleRunning
  });
  // Set runner as a global variable if you need runtime debugging.
  window.runner = runner;
  // Initialize everything in the game and start the game.
  runner.init();

  InitializeExcel()
}
// variable which tells whether thethe game is being loaded for the first time i.e. not a reset

let firstTime = true;


function handleReset(dinos) {
  // running this for single dino at a time
  // console.log(dinos);

  const dino = dinos[0];
  // if the game is being started for the first time initiate 
  // the model and compile it to make it ready for training and predicting
  if (firstTime) {
    firstTime = false;
    // creating a tensorflow sequential model
    dino.model = tf.sequential();
    // dino.model.init();
    // adding the first hidden layer to the model using with 3 inputs ,
    // sigmoid activation function
    // and output of 6
    dino.model.add(tf.layers.dense({
      inputShape: [7],
      activation: 'sigmoid',
      units: 14
    }))

    /* this is the second output layer with 6 inputs coming from the previous hidden layer
    activation is again sigmoid and output is given as 2 units 10 for not jump and 01 for jump
    */
    dino.model.add(tf.layers.dense({
      inputShape: [14],
      activation: 'sigmoid',
      units: 3
    }))

    /* compiling the model using meanSquaredError loss function and adam 
    optimizer with a learning rate of 0.1 */
    dino.model.compile({
      loss: 'meanSquaredError',
      optimizer: tf.train.adam(0.2)
    })

    // object which will containn training data and appropriate labels
    dino.training = {
      inputs: [],
      labels: []
    };

  } else {
    // Train the model before restarting.
    // log into console that model will now be trained
    //console.info('Training');
    // convert the inputs and labels to tensor2d format and  then training the model
    //console.info(tf.tensor2d(dino.training.inputs))
    dino.model.fit(tf.tensor2d(dino.training.inputs), tf.tensor2d(dino.training.labels));
  }
}

/**
 * documentation
 * @param {object} dino
 * @param {object} state
 * returns a promise resolved with an action
 */

function handleRunning(dino, state) {
  return new Promise((resolve) => {

    if (!dino.jumping) {

      //if (state.obstacleX <= -20) handleSuccess(dino, state)
        
      // whenever the dino is not jumping decide whether it needs to jump or not
      let action = 0;// variable for action 1 for jump 0 for not
      // call model.predict on the state vecotr after converting it to tensor2d object
      const prediction = dino.model.predict(tf.tensor2d([convertStateToVector(state)]));
  
      // the predict function returns a tensor we get the data in a promise as result
      // and based don result decide the action
      const predictionPromise = prediction.data();
  
      predictionPromise.then((result) => {
        //console.log(result);
        // converting prediction to action
        const result_value = Math.max(result[0], result[1], result[2])
  
        switch (result_value) {
          case result[0]:
            dino.lastRunningState = state;
            break;
            case result[1]:
            action = 1;
            dino.lastJumpingState = state;
            break;
          case result[2]:
            action = -1;
            dino.lastDuckingState = state;
            break;
            default:
              break;
            }
            
            resolve(action);
          });
        } else {
          resolve(0)
        }
  });
}

function handleSuccess(dino, state) {
  let input = null;
  let label = null;

  if (dino.jumping) {
    input = convertStateToVector(state);
    label = [0, 1, 0];
  } else if (dino.ducking) {
    input = convertStateToVector(state)
    label = [0, 0, 1]
  } else {
    input = convertStateToVector(state);
    label = [1, 0, 0];
  }

  console.log('succ', state, label)
  dino.training.inputs.push(input);
  dino.training.labels.push(label);
}

/**
 * 
 * @param {object} dino 
 * handles the crash of a dino before restarting the game
 * 
 */
function handleCrash(dino) {
  let input = null;
  let label = null;

  generation++
  console.log(generation, runner.distanceRan)
  AppendToExcel(generation, runner.distanceRan)

  // check if at the time of crash dino was jumping or not
  if (dino.jumping) {
    // Should not jump next time
    // convert state object to array
    input = convertStateToVector(dino.lastJumpingState);
    label = [1, 0, 1];
  } else if (dino.ducking) {
    input = convertStateToVector(dino.lastDuckingState)
    label = [1, 1, 0]
  } else {
    // Should jump next time
    // convert state object to array
    input = convertStateToVector(dino.lastRunningState);
    label = [0, 1, 1];
  }
  // push the new input to the training set
  dino.training.inputs.push(input);
  // push the label to labels
  dino.training.labels.push(label);
}

/**
 * 
 * @param {object} state
 * returns an array 
 * converts state to a feature scaled array
 */
function convertStateToVector(state) {
  if (state) {
    return [
      state.obstacleX / CANVAS_WIDTH,
      state.tRexYPosition / CANVAS_HEIGHT,
      state.obstacleWidth / CANVAS_WIDTH,
      state.obstacleY / CANVAS_HEIGHT,
      state.speed / 100,
      state.jumping,
      state.ducking
    ];
  }
  return [0, 0, 0, 0, 0, 0, 0];
}
// call setup on loading content
document.addEventListener('DOMContentLoaded', setup);
