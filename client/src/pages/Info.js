import React, {useState, useEffect} from 'react';
import DateRangePicker from '@wojtekmaj/react-daterange-picker';
import { Chart } from 'components';
import './css/Info.css';
import { getMaxEXP, getRateEXP } from '../module/level';
import LinearProgress from '@material-ui/core/LinearProgress';
import Paper from '@material-ui/core/Paper';
import * as planTypes from '../components/PlannerTypes';
import { useSelector, useDispatch } from 'react-redux';
import { getPlanListRequest } from 'actions/planner';
import CircularProgress from '@material-ui/core/CircularProgress';
import moment from 'moment';
import {PlanListContainer} from 'components';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../components/css/Toast.css';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';

const Info = (props) => {
  // Redux hooks
  const dispatch = useDispatch();
  const [planList, getStatus] = useSelector(state => [state.planner.toJS().planList, state.planner.toJS().get, state.planner.toJS().post, state.planner.toJS().delete, state.planner.toJS().update] , []);

  const [chartPeriod, setChartPeriod] = useState([moment(new Date()).subtract(30, 'day'), new Date()]);
  const [logList, setLogList] = useState([]);

  const onPeriodChange = (date) => {
    if(moment(date[1], 'YYYY-MM-DD').diff(new Date(), 'day') > 0){
      toast.error(<div className="toast_wrapper"><ErrorOutlineIcon className="toast"/>
      기간은 오늘 이후로 설정할 수 없습니다.
      </div>);
      return;
    }
    setChartPeriod(date);
  }

  useEffect(() => {
    dispatch(getPlanListRequest(props.loginInfo.email,
    {
      dateStart: todayDate[0],
      dateEnd: todayDate[1],
    }));
    axios.post('/api/explog/getLog/', {email: props.loginInfo.email}).then(explog => {
      console.log(explog.data.row);
      setLogList(explog.data.row);
    }).catch(error => {
      console.log(error);
    });
  }, []);

  // 해당 날짜에 플레이어의 경험치 값을 가져오는 함수
  const getLogExp = (currentDate) => {
    let resultExp = 0;
    // 현재 날짜와 가장 근접한 날짜에 대한 차이를 저장하는 변수임. 최솟값을 찾기위해 초기값을 큰 수로 저장
    let closestDiff = 100000000000;
    for(let i = 0; i < logList.length; i++){
      let diff = moment(currentDate).diff(logList[i].date, 'day');
      if(diff < 0)
        return resultExp;
      if(diff < closestDiff){
        closestDiff = diff;
        resultExp = logList[i].totalExp;
      }
    }
    return resultExp;
  }

  // 사용자가 설정한 기간에 해당하는 로그값들을 가져오는 함수
  const getChartLabels = (startDate, endDate) => {
    let resultLabels = [];
    
    let diffDate = moment(endDate).diff(startDate, 'day');
    for(let i = 0; i <= diffDate; i++){
      let tempDate = moment(startDate).add(i, 'day');
      resultLabels.push(moment(tempDate).format('YYYY년 MM월 DD일'));
    }
    return resultLabels;
  };

  // 각 label에 해당하는 날짜의 유저의 경험치 로그 값 배열 반환
  const getChartData = (labels) =>{
    let resultData = [];
    for (let label of labels)
      resultData.push(getLogExp(moment(label, 'YYYY년 MM월 DD일').toDate()));
    return resultData;
  };
  
  let tempDate = new Date();
  let startDate = moment([tempDate.getFullYear(), tempDate.getMonth(), 1]).toDate();
  let endDate = moment([tempDate.getFullYear(), tempDate.getMonth(), 1]).toDate();
  endDate = moment(endDate).add(1, 'month').subtract(1, 'days').toDate();
  let todayDate = [moment().toDate(), moment().toDate()];
  let monthDate = [startDate, endDate];
  startDate = moment([tempDate.getFullYear(), 0, 1]).toDate();
  endDate = moment([tempDate.getFullYear(), 0, 1]).toDate();
  endDate = moment(endDate).add(1, 'year').subtract(1, 'days').toDate();
  let yearDate = [startDate, endDate];

  return (
    <React.Fragment>
      <div className="infoContainer">
        <div className="infoContents">
          <Paper className="userInfoSection userLevelSection">
            <div className="row_container1">
              <div className="userLevel">
                Lv.{props.userInfo.level}
              </div>
              <div className="userName">
                {props.userInfo.nickname}
              </div>
            </div>
            <div className="row_container2">
              <div className="userExp">
                EXP: {getRateEXP(props.userInfo.level, props.userInfo.exp)}%  ( {props.userInfo.exp} / {getMaxEXP(props.userInfo.level)} ) 
              </div>
            </div>
            <div className="row_container3">
              <div>
                <LinearProgress variant="determinate" value={getRateEXP(props.userInfo.level, props.userInfo.exp)} className="userInfoExpBar"/>
              </div>
            </div>
          </Paper>
          <Paper className="userInfoSection userPlanSection">
            <div className="planInfoContainer todayPlanContainer">
              <div className="containerTitle">오늘 일정</div>
              <PlanListContainer 
              author={props.loginInfo.email} 
              planList={planList} 
              type={planTypes.DAILY_PLAN}  
              date={todayDate}
              addButton={false}
              turnOnTaskRatio={true}
              />
            </div>
            <div className="planInfoContainer monthPlanContainer">
              <div className="containerTitle">이번 달 목표</div>
              <PlanListContainer 
              author={props.loginInfo.email} 
              planList={planList} 
              type={planTypes.MONTHLY_PLAN}  
              date={monthDate}
              addButton={false}
              turnOnTaskRatio={true}
              />
            </div>
            <div className="planInfoContainer yearPlanContainer">
              <div className="containerTitle">올해 목표</div>
              <PlanListContainer 
              author={props.loginInfo.email} 
              planList={planList} 
              type={planTypes.YEARLY_PLAN}  
              date={yearDate}
              addButton={false}
              turnOnTaskRatio={true}
              />
            </div>
          </Paper>
          <Paper className="userInfoSection userExpChartSection">
            <div>
              <DateRangePicker
                onChange={onPeriodChange}
                value={chartPeriod}
              />
            </div>
            <div className="userExpChartContainer">
              <Chart labels={getChartLabels(chartPeriod[0], chartPeriod[1])} data={getChartData(getChartLabels(chartPeriod[0], chartPeriod[1]))}/>
            </div>
          </Paper>
        </div>
      </div>
    </React.Fragment>
  );
};

export default Info;
