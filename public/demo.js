class Human {
  constructor(name = "jackson") {
    this.name = name;
    this.age = 100;
    this.sex = "man";
  }
  getName() {
    return this.name;
  }
  setName(name) {
    this.name == name;
  }
  getAge() {
    return this.age;
  }
  getSex() {
    return this.sex;
  }
}

export default Human;
