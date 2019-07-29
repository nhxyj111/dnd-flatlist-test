import React, { createRef } from 'react';
import { StyleSheet, Text, View, FlatList, PanResponderInstance, PanResponder, Animated, SafeAreaView, Button } from 'react-native';

function getRandomColor() {
  var letters = '0123456789ABCDEF'
  var color = '#'
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }
  return color
}

const colorMap = {}
export default class App extends React.Component {
  state = {
    dragging: false,
    draggingIdx: -1,
    data: Array.from(Array(200), (_, i) => {
      colorMap[i] = getRandomColor()
      return i
    })
  }

  _panResponder: PanResponderInstance

  point = new Animated.ValueXY()

  scrollOffset = 0

  flatlistTopOffset = 0

  rowHeight = 0

  currentIdx = -1

  currentY = 0

  active = false

  flatList = createRef<FlatList<any>>()

  flatListHeight = 0

  constructor(props) {
    super(props)
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
      onPanResponderGrant: (evt, gestureState) => {
        this.currentIdx = this.yToIndex(gestureState.y0)
        this.currentY = gestureState.y0
        this.active = true
        Animated.event([{ y: this.point.y }])({ y: gestureState.y0 - this.rowHeight / 2 })
        this.setState({ dragging: true, draggingIdx: this.currentIdx }, () => {
          this.animateList()
        })
      },
      onPanResponderMove: (evt, gestureState) => {
        // console.log(gestureState.moveY)
        this.currentY = gestureState.moveY
        Animated.event([{ y: this.point.y }])({ y: gestureState.moveY })
      },
      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onPanResponderRelease: (evt, gestureState) => {
        this.reset()
      },
      onPanResponderTerminate: (evt, gestureState) => {
        this.reset()
      },
      onShouldBlockNativeResponder: (evt, gestureState) => true
    })
  }

  animateList = () => {
    if (!this.active) {
      return;
    }


    requestAnimationFrame(() => {
      if (this.currentY + 100 > this.flatListHeight) {
        this.flatList.current.scrollToOffset({
          offset: this.scrollOffset + 15,
          animated: false
        })
      } else if (this.currentY < 100) {
        this.flatList.current.scrollToOffset({
          offset: this.scrollOffset - 15,
          animated: false
        })
      }

      const newIdx = this.yToIndex(this.currentY)
      if (this.currentIdx !== newIdx) {
        this.setState({
          data: this.immutableMove(this.state.data, this.currentIdx, newIdx),
          draggingIdx: newIdx
        })
        this.currentIdx = newIdx
      }
      this.animateList()
    })
  }

  yToIndex = (y: number) => {
    const value = Math.floor((this.scrollOffset + y - this.flatlistTopOffset) / this.rowHeight)
    if (value < 0) {
      return 0
    }
    if (value > this.state.data.length - 1) {
      return this.state.data.length - 1
    }
    return value
  }

  reset = () => {
    this.active = false
    this.setState({ dragging: false, draggingIdx: -1 })
  }

  immutableMove = (arr: number[], from: number, to: number) => {
    return arr.reduce((prev, current, idx, self) => {
      if (from === to) {
        prev.push(current)
      }
      if (idx === from) {
        return prev
      }
      if (from < to) {
        prev.push(current)
      }
      if (idx === to) {
        prev.push(self[from])
      }
      if (from > to) {
        prev.push(current)
      }
      return prev
    }, [])
  }

  render() {
    const { data, dragging, draggingIdx } = this.state

    const renderItem = ({ item, index }, noPanResponder = false) => (
      <View
        onLayout={e => this.rowHeight = e.nativeEvent.layout.height}
        style={{
          backgroundColor: colorMap[item],
          padding: 16,
          flexDirection: 'row',
          opacity: draggingIdx === index ? 0 : 1
        }}>
        <View {...(noPanResponder ? {} : this._panResponder.panHandlers)}>
          <Text style={{ fontSize: 28 }}>@</Text>
        </View>
        <Text style={{ fontSize: 22, textAlign: "center", flex: 1 }}>{item}</Text>
      </View>
    )

    return (
      <SafeAreaView style={styles.container}>
        {dragging &&
          <Animated.View style={{ position: 'absolute', backgroundColor: 'black', zIndex: 2, width: '100%', top: this.point.getLayout().top }}>
            {renderItem({ item: data[draggingIdx], index: -1 }, true)}
          </Animated.View>}
        <FlatList
          // ListHeaderComponent={() => {
          //   return (
          //     <Button title="scroll down" onPress={() => {
          //       this.flatList.current.scrollToIndex({ index: 80, animated: true })
          //     }} />
          //   )
          // }}
          ref={this.flatList}
          scrollEnabled={!dragging}
          scrollEventThrottle={16}
          onScroll={e => {
            // console.log(e)
            this.scrollOffset = e.nativeEvent.contentOffset.y
          }}
          onLayout={e => {
            this.flatlistTopOffset = e.nativeEvent.layout.y
            this.flatListHeight = e.nativeEvent.layout.height
          }}
          style={{ width: '100%' }}
          data={data}
          renderItem={renderItem}
          keyExtractor={item => `${item}`} />

      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
